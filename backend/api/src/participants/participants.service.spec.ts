// cbt-realtime-system/backend/api/src/participants/participants.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantsService } from './participants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Participant, ParticipantStatus } from './entities/participant.entity';
import { Examinee } from '../examinees/entities/examinee.entity';
import { Exam } from '../exams/entities/exam.entity';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { ExamQuestion } from '../exams/entities/exam-question.entity';
import { ParticipantExamQuestion } from './entities/participant-exam-question.entity';
import { ExamRule } from '../exams/entities/exam-rule.entity';
import { Question } from '../questions/entities/question.entity';
import { LiveExamGateway } from '../live-exam/live-exam.gateway';
import { AuthService } from '../auth/auth.service';
import { Repository } from 'typeorm';
import { JoinExamDto } from './dto/join-exam.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

// Membuat mock untuk semua dependensi
const mockParticipantRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};
const mockExamineeRepository = {
  findOneBy: jest.fn(),
};
const mockExamRepository = {
  findOneBy: jest.fn(),
};
const mockAnswerRepository = {
  find: jest.fn(),
};
const mockExamQuestionRepository = {};
const mockPeqRepository = {};
const mockExamRuleRepository = {};
const mockQuestionRepository = {};
const mockLiveExamGateway = {
  broadcastNewParticipant: jest.fn(),
  broadcastStatusUpdate: jest.fn(),
};
const mockAuthService = {
  loginParticipant: jest.fn(),
};

describe('ParticipantsService', () => {
  let service: ParticipantsService;
  let participantRepository: Repository<Participant>;
  let examineeRepository: Repository<Examinee>;
  let examRepository: Repository<Exam>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        {
          provide: getRepositoryToken(Participant),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(Examinee),
          useValue: mockExamineeRepository,
        },
        { provide: getRepositoryToken(Exam), useValue: mockExamRepository },
        {
          provide: getRepositoryToken(ParticipantAnswer),
          useValue: mockAnswerRepository,
        },
        {
          provide: getRepositoryToken(ExamQuestion),
          useValue: mockExamQuestionRepository,
        },
        {
          provide: getRepositoryToken(ParticipantExamQuestion),
          useValue: mockPeqRepository,
        },
        {
          provide: getRepositoryToken(ExamRule),
          useValue: mockExamRuleRepository,
        },
        {
          provide: getRepositoryToken(Question),
          useValue: mockQuestionRepository,
        },
        { provide: LiveExamGateway, useValue: mockLiveExamGateway },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<ParticipantsService>(ParticipantsService);
    participantRepository = module.get<Repository<Participant>>(
      getRepositoryToken(Participant),
    );
    examineeRepository = module.get<Repository<Examinee>>(
      getRepositoryToken(Examinee),
    );
    examRepository = module.get<Repository<Exam>>(getRepositoryToken(Exam));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinExam', () => {
    it('should allow a new participant to join and return a token', async () => {
      // 1. Arrange
      const joinExamDto: JoinExamDto = { examinee_id: 1, code: 'EXAM-01' };
      const mockExaminee = new Examinee();
      mockExaminee.id = 1;
      mockExaminee.name = 'Budi';

      const mockExam = new Exam();
      mockExam.id = 1;
      mockExam.code = 'EXAM-01';

      const mockParticipant = new Participant();
      mockParticipant.id = 1;
      mockParticipant.examinee = mockExaminee;
      mockParticipant.exam = mockExam;

      const mockToken = { access_token: 'some-jwt-token' };

      mockExamineeRepository.findOneBy.mockResolvedValue(mockExaminee);
      mockExamRepository.findOneBy.mockResolvedValue(mockExam);
      (participantRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockParticipant);
      mockParticipantRepository.create.mockReturnValue(mockParticipant);
      mockParticipantRepository.save.mockResolvedValue(mockParticipant);
      mockAuthService.loginParticipant.mockResolvedValue(mockToken);

      // 2. Act
      const result = await service.joinExam(joinExamDto);

      // 3. Assert
      expect(result.participant).toBe(mockParticipant);
      expect(result.access_token).toBe(mockToken.access_token);
      expect(participantRepository.save).toHaveBeenCalled();
      expect(mockAuthService.loginParticipant).toHaveBeenCalledWith(
        mockParticipant,
      );
    });

    it('should throw ForbiddenException if the exam is already finished', async () => {
      const joinExamDto: JoinExamDto = { examinee_id: 1, code: 'EXAM-01' };
      const mockExaminee = new Examinee();
      mockExaminee.id = 1;
      const mockExam = new Exam();
      mockExam.id = 1;

      const existingParticipant = new Participant();
      existingParticipant.status = ParticipantStatus.FINISHED;

      mockExamineeRepository.findOneBy.mockResolvedValue(mockExaminee);
      mockExamRepository.findOneBy.mockResolvedValue(mockExam);
      mockParticipantRepository.findOne.mockResolvedValue(existingParticipant);

      await expect(service.joinExam(joinExamDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('beginExam', () => {
    it('should set start_time for a new session and broadcast the participant', async () => {
      const participantId = 1;
      const mockParticipant = new Participant();
      mockParticipant.id = participantId;
      // PERBAIKAN: Gunakan 'as any' untuk bypass pengecekan tipe TypeScript
      mockParticipant.start_time = null as any;
      mockParticipant.exam = { id: 10 } as Exam;
      mockParticipant.examinee = { name: 'Siti' } as Examinee;

      mockParticipantRepository.findOne.mockResolvedValue(mockParticipant);
      mockParticipantRepository.save.mockImplementation((p) =>
        Promise.resolve(p),
      );

      const result = await service.beginExam(participantId);

      expect(result.start_time).toBeInstanceOf(Date);
      expect(participantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          start_time: expect.any(Date),
        }),
      );
      expect(mockLiveExamGateway.broadcastNewParticipant).toHaveBeenCalledWith(
        10,
        1,
        'Siti',
        undefined,
        expect.any(Date),
      );
    });
  });

  describe('finishExam', () => {
    it('should calculate final score, set status to FINISHED, and broadcast the update', async () => {
      const participantId = 1;
      const mockParticipant = new Participant();
      mockParticipant.id = participantId;
      mockParticipant.exam = { id: 10 } as Exam;

      const mockAnswers = [
        { participant_exam_question: { point: 10 } },
        { participant_exam_question: { point: 15 } },
      ] as ParticipantAnswer[];

      mockAnswerRepository.find.mockResolvedValue(mockAnswers);
      mockParticipantRepository.findOne.mockResolvedValue(mockParticipant);
      mockParticipantRepository.save.mockImplementation((p) =>
        Promise.resolve(p),
      );

      const result = await service.finishExam(participantId);

      expect(result.final_score).toBe(25);
      expect(result.status).toBe(ParticipantStatus.FINISHED);
      expect(participantRepository.save).toHaveBeenCalled();
      expect(mockLiveExamGateway.broadcastStatusUpdate).toHaveBeenCalledWith(
        10,
        1,
        ParticipantStatus.FINISHED,
        expect.any(Date),
      );
    });
  });
});
