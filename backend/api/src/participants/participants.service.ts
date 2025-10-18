// src/participants/participants.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Exam } from 'src/exams/entities/exam.entity';
import { Examinee } from 'src/examinees/entities/examinee.entity';
import { Repository, Not, In } from 'typeorm';
import { JoinExamDto } from './dto/join-exam.dto';
import { Participant, ParticipantStatus } from './entities/participant.entity';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { ExamQuestion } from 'src/exams/entities/exam-question.entity';
import { ParticipantExamQuestion } from './entities/participant-exam-question.entity';
import { ExamRule } from 'src/exams/entities/exam-rule.entity';
import { Question } from 'src/questions/entities/question.entity';
// Define or import SubmitAnswerPayload type
interface SubmitAnswerPayload {
  participantId: number;
  examQuestionId: number;
  answer: string;
}

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Examinee)
    private readonly examineeRepository: Repository<Examinee>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ParticipantAnswer)
    private readonly answerRepository: Repository<ParticipantAnswer>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(ParticipantExamQuestion)
    private readonly peqRepository: Repository<ParticipantExamQuestion>,
    @InjectRepository(ExamRule)
    private readonly examRuleRepository: Repository<ExamRule>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async joinExam(joinExamDto: JoinExamDto) {
    // Validasi examinee dan exam (tetap sama)
    const examinee = await this.examineeRepository.findOneBy({ id: joinExamDto.examinee_id });
    if (!examinee) throw new NotFoundException('Peserta tidak ditemukan');

    const exam = await this.examRepository.findOneBy({ code: joinExamDto.code });
    if (!exam) throw new NotFoundException('Ujian tidak ditemukan');
    
    // Validasi jadwal (tetap sama)
    const now = new Date();
    if (exam.start_time && now < exam.start_time) throw new ForbiddenException('Ujian ini belum dimulai.');
    if (exam.end_time && now > exam.end_time) throw new ForbiddenException('Waktu untuk bergabung ujian telah berakhir.');

    // Cari sesi yang ada
    const existingParticipant = await this.participantRepository.findOne({
      where: { examinee: { id: examinee.id }, exam: { id: exam.id } },
      relations: ['examinee', 'exam'],
    });

    if (existingParticipant) {
      if (existingParticipant.status === ParticipantStatus.FINISHED) {
        throw new ForbiddenException('Anda sudah pernah menyelesaikan ujian ini.');
      }
      console.log(`Peserta ${examinee.name} kembali ke lobi.`);
      return existingParticipant; // Langsung kembalikan, jangan reset timer
    }

    // Jika tidak ada sesi, buat yang baru TANPA start_time
    console.log(`Membuat sesi lobi baru untuk ${examinee.name}.`);
    const newParticipant = this.participantRepository.create({
      examinee: examinee,
      exam: exam,
      // start_time sengaja dibiarkan null
    });

    return this.participantRepository.save(newParticipant);
  }

  async beginExam(participantId: number) {
    const participant = await this.participantRepository.findOneBy({ id: participantId });
    if (!participant) {
      throw new NotFoundException('Sesi pengerjaan tidak ditemukan.');
    }

    // PENTING: Hanya set start_time jika belum pernah di-set sebelumnya
    if (participant.start_time === null) {
      console.log(`Peserta ID ${participantId} memulai ujian. Timer dimulai.`);
      participant.start_time = new Date();
      return this.participantRepository.save(participant);
    }

    console.log(`Peserta ID ${participantId} melanjutkan ujian yang sudah berjalan.`);
    return participant; // Jika sudah ada, kembalikan saja tanpa mengubah apa pun
  }

  async saveAnswer(data: SubmitAnswerPayload) {
    const participantExamQuestion = await this.peqRepository.findOneBy({ id: data.examQuestionId });
    if (!participantExamQuestion) return;

    const isCorrect = participantExamQuestion.question.correct_answer === data.answer;
    
    await this.answerRepository.upsert({
      participant: { id: data.participantId },
      participant_exam_question: { id: data.examQuestionId },
      answer: data.answer,
      is_correct: isCorrect,
    }, ['participant', 'participant_exam_question']);

    console.log(`Jawaban untuk PEQ ID ${data.examQuestionId} disimpan. Status: ${isCorrect}`);
  }

  async finishExam(participantId: number) {
    const correctAnswers = await this.answerRepository.find({
      where: {
        participant: { id: participantId },
        is_correct: true,
      },
      relations: ['participant_exam_question'],
    });

    const totalScore = correctAnswers.reduce((sum, answer) => {
      return sum + (answer.participant_exam_question?.point || 0);
    }, 0);

    const participant = await this.participantRepository.findOneBy({ id: participantId });
    if (!participant) throw new NotFoundException('Sesi pengerjaan tidak ditemukan');

    participant.status = ParticipantStatus.FINISHED;
    participant.final_score = totalScore;
    await this.participantRepository.save(participant);

    console.log(`Ujian untuk peserta ID ${participantId} selesai. Skor akhir: ${totalScore}`);
    return participant;
  }

  async getParticipantAnswers(participantId: number) {
    const answers = await this.answerRepository.find({
      where: { participant: { id: participantId } },
      relations: ['participant_exam_question'],
    });
  
    const formattedAnswers: Record<number, string> = {};
    answers.forEach(ans => {
      if (ans.participant_exam_question) {
        formattedAnswers[ans.participant_exam_question.id] = ans.answer;
      }
    });
    return formattedAnswers;
  }

  async getExamQuestions(participantId: number) {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
      relations: ['examinee', 'exam', 'generated_questions'],
    });

    if (!participant) throw new NotFoundException('Sesi pengerjaan tidak ditemukan');
    if (participant.status === ParticipantStatus.FINISHED) throw new ForbiddenException('Ujian ini telah selesai.');

    if (!participant.generated_questions || participant.generated_questions.length === 0) {
      console.log(`Membuat set soal baru untuk peserta ID ${participantId}`);
      const finalQuestionSet: { question: Question; point: number }[] = [];
      const usedQuestionIds: number[] = [];

      const manualQuestions = await this.examQuestionRepository.find({
        where: { exam: { id: participant.exam.id } },
        relations: ['question'],
      });
      manualQuestions.forEach(mq => {
        if (mq.question) {
          finalQuestionSet.push({ question: mq.question, point: mq.point });
          usedQuestionIds.push(mq.question.id);
        }
      });

      const randomRules = await this.examRuleRepository.find({
        where: { exam: { id: participant.exam.id } },
        relations: ['question_bank'],
      });

      for (const rule of randomRules) {
        const randomQuestions = await this.questionRepository.find({
          where: {
            bank: { id: rule.question_bank.id },
            id: Not(In(usedQuestionIds.length > 0 ? usedQuestionIds : [0])),
          },
          order: { id: 'ASC' },
          take: rule.number_of_questions,
        });
        
        randomQuestions.forEach(rq => {
          finalQuestionSet.push({ question: rq, point: rule.point_per_question });
          usedQuestionIds.push(rq.id);
        });
      }
      
      finalQuestionSet.sort(() => Math.random() - 0.5);

      const participantExamQuestionsToSave = finalQuestionSet.map(item => 
        this.peqRepository.create({
          participant: { id: participant.id },
          question: { id: item.question.id },
          point: item.point,
        })
      );
      await this.peqRepository.save(participantExamQuestionsToSave);
      
      return this.getExamQuestions(participantId);
    }

    console.log(`Mengambil set soal yang sudah ada untuk peserta ID ${participantId}`);
    
    let timeLeftSeconds: number; // Deklarasi dipindahkan ke sini
    if (!participant.start_time) {
      timeLeftSeconds = participant.exam.duration_minutes * 60;
    } else {
      const now = Date.now();
      const sessionStartTime = new Date(participant.start_time).getTime();
      const sessionDurationInMs = participant.exam.duration_minutes * 60 * 1000;
      const sessionEndTime = sessionStartTime + sessionDurationInMs;
      const scheduledEndTime = participant.exam.end_time ? new Date(participant.exam.end_time).getTime() : Infinity;
      const actualEndTime = Math.min(sessionEndTime, scheduledEndTime);
      timeLeftSeconds = Math.max(0, Math.floor((actualEndTime - now) / 1000));
    }

    participant.generated_questions.forEach((peq) => {
      if (peq.question) {
        const { correct_answer, ...questionDetails } = peq.question;
        peq.question = questionDetails as any;
      }
    });

    const response = {
      ...participant,
      exam: {
        ...participant.exam,
        exam_questions: participant.generated_questions,
      },
      time_left_seconds: timeLeftSeconds,
    };
    delete (response as any).generated_questions;

    return response;
  }
}
