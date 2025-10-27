// cbt-realtime-system/backend/api/src/exams/exams.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamRule } from './entities/exam-rule.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { Repository } from 'typeorm';
import { CreateExamDto } from './dto/create-exam.dto';
import { Participant } from '../participants/entities/participant.entity';
import { ParticipantAnswer } from '../participants/entities/participant-answer.entity';

// PERBAIKAN: Membuat mock untuk SEMUA repository yang dibutuhkan
const mockExamRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockExamRuleRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockExamQuestionRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockParticipantRepository = {
  // Tambahkan fungsi mock jika dibutuhkan di masa depan
};

const mockParticipantAnswerRepository = {
  // Tambahkan fungsi mock jika dibutuhkan di masa depan
};

describe('ExamsService', () => {
  let service: ExamsService;
  let examRepository: Repository<Exam>;
  let examQuestionRepository: Repository<ExamQuestion>;
  let examRuleRepository: Repository<ExamRule>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        // PERBAIKAN: Menyediakan semua mock repository yang dibutuhkan oleh constructor
        { provide: getRepositoryToken(Exam), useValue: mockExamRepository },
        { provide: getRepositoryToken(ExamRule), useValue: mockExamRuleRepository },
        { provide: getRepositoryToken(ExamQuestion), useValue: mockExamQuestionRepository },
        { provide: getRepositoryToken(Participant), useValue: mockParticipantRepository },
        { provide: getRepositoryToken(ParticipantAnswer), useValue: mockParticipantAnswerRepository },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    // Mengambil instance repository untuk mempermudah penulisan 'expect'
    examRepository = module.get<Repository<Exam>>(getRepositoryToken(Exam));
    examQuestionRepository = module.get<Repository<ExamQuestion>>(getRepositoryToken(ExamQuestion));
    examRuleRepository = module.get<Repository<ExamRule>>(getRepositoryToken(ExamRule));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an exam and save its manual questions and random rules', async () => {
      // 1. Arrange
      const createExamDto: CreateExamDto = {
        title: 'Ujian Kimia',
        code: 'KIM-01',
        duration_minutes: 90,
        manual_questions: [{ question_id: 101, point: 20 }],
        random_rules: [{ question_bank_id: 1, number_of_questions: 10, point_per_question: 8 }],
      };
      
      const savedExam = { id: 1, ...createExamDto };

      // Mengatur perilaku mock
      mockExamRepository.create.mockReturnValue(createExamDto); // create mengembalikan DTO
      mockExamRepository.save.mockResolvedValue(savedExam); // save mengembalikan Exam yang sudah disimpan
      mockExamQuestionRepository.create.mockImplementation(q => q); // create mengembalikan inputnya
      mockExamRuleRepository.create.mockImplementation(r => r); // create mengembalikan inputnya

      // 2. Act
      const result = await service.create(createExamDto);

      // 3. Assert
      expect(result).toEqual(savedExam);
      
      // Pastikan data utama ujian disimpan
      expect(examRepository.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Ujian Kimia' }));
      expect(examRepository.save).toHaveBeenCalledWith(createExamDto);
      
      // Pastikan soal manual disimpan
      expect(examQuestionRepository.save).toHaveBeenCalled();
      
      // Pastikan aturan acak disimpan
      expect(examRuleRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of exams', async () => {
      const mockExams = [{ id: 1, title: 'Exam 1' }];
      mockExamRepository.find.mockResolvedValue(mockExams);

      const result = await service.findAll();

      expect(result).toEqual(mockExams);
      expect(examRepository.find).toHaveBeenCalledWith({ order: { id: 'DESC' } });
    });
  });

  describe('findOne', () => {
    it('should return a single exam with its relations', async () => {
      const examId = 1;
      const mockExam = { id: examId, title: 'Detailed Exam' };
      mockExamRepository.findOne.mockResolvedValue(mockExam);

      const result = await service.findOne(examId);

      expect(result).toEqual(mockExam);
      expect(examRepository.findOne).toHaveBeenCalledWith({
        where: { id: examId },
        relations: [
          'exam_questions',
          'exam_questions.question',
          'exam_rules',
          'exam_rules.question_bank',
        ],
      });
    });
  });
});