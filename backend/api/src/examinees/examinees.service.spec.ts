// cbt-realtime-system/backend/api/src/examinees/examinees.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ExamineesService } from './examinees.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Examinee } from './entities/examinee.entity';
import { Repository } from 'typeorm';
import { Batch } from 'src/batches/entities/batch.entity';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';

// Membuat mock untuk ExamineeRepository
const mockExamineeRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  preload: jest.fn(),
};

const mockBatchRepository = {
  findOneBy: jest.fn(),
};

describe('ExamineesService', () => {
  let service: ExamineesService;
  let repository: Repository<Examinee>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamineesService,
        {
          provide: getRepositoryToken(Examinee),
          useValue: mockExamineeRepository,
        },
        {
          provide: getRepositoryToken(Batch),
          useValue: mockBatchRepository,
        },
      ],
    }).compile();

    service = module.get<ExamineesService>(ExamineesService);
    repository = module.get<Repository<Examinee>>(getRepositoryToken(Examinee));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new examinee', async () => {
      const createDto = { name: 'Andi' } as CreateExamineeDto;
      const newExaminee = new Examinee();
      newExaminee.name = 'Andi';

      mockExamineeRepository.create.mockReturnValue(newExaminee);
      mockExamineeRepository.save.mockResolvedValue({ newExaminee, id: 1 });

      const result = await service.create(createDto, null as any);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          uniqid: expect.any(String),
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(newExaminee);
    });

    it('should generate uniqid and allow duplicate names', async () => {
      const createDto = { name: 'Andi' } as CreateExamineeDto;

      // Mock create to return object with uniqid
      mockExamineeRepository.create.mockImplementation((dto) => dto);
      mockExamineeRepository.save.mockImplementation((dto) =>
        Promise.resolve({ id: 1, ...dto }),
      );

      const result1 = await service.create(createDto, null as any);
      const result2 = await service.create(createDto, null as any);

      expect(result1.uniqid).toBeDefined();
      expect(result1.uniqid).toMatch(/^\d{8}-[A-Z0-9]{4}$/); // Check format YYYYMMDD-XXXX

      expect(result2.uniqid).toBeDefined();
      expect(result2.uniqid).not.toBe(result1.uniqid); // Should be different even if name is same
    });
  });

  describe('findAll', () => {
    it('should return paginated examinees', async () => {
      const options = { page: 1, limit: 10 };
      const mockExaminees = [new Examinee()];
      const total = 1;
      mockExamineeRepository.findAndCount.mockResolvedValue([
        mockExaminees,
        total,
      ]);

      const result = await service.findAll(options);

      expect(result.data).toEqual(mockExaminees);
      expect(result.total).toBe(total);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { name: 'ASC' },
        take: options.limit,
        skip: 0,
        relations: {
          batch: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single examinee with relations', async () => {
      const examineeId = 1;
      const mockExaminee = new Examinee();
      mockExamineeRepository.findOne.mockResolvedValue(mockExaminee);

      const result = await service.findOne(examineeId);

      expect(result).toEqual(mockExaminee);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: examineeId },
        relations: ['participants', 'participants.exam'],
      });
    });
  });

  describe('update', () => {
    it('should update an examinee', async () => {
      const examineeId = 1;
      const updateDto = { name: 'Budi' } as UpdateExamineeDto;
      const updatedExaminee = new Examinee();
      updatedExaminee.id = examineeId;
      updatedExaminee.name = 'Budi';

      mockExamineeRepository.preload.mockResolvedValue(updatedExaminee);
      mockExamineeRepository.findOneBy.mockResolvedValue(updatedExaminee);

      const result = await service.update(examineeId, updateDto, null as any);

      expect(result).toEqual(updatedExaminee);
      expect(repository.preload).toHaveBeenCalledWith(
        expect.objectContaining({
          id: examineeId,
          ...updateDto,
        }),
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: examineeId });
    });
  });

  describe('remove', () => {
    it('should delete an examinee', async () => {
      const examineeId = 1;
      mockExamineeRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(examineeId);

      expect(repository.delete).toHaveBeenCalledWith(examineeId);
    });
  });

  describe('findAllSimple', () => {
    it('should return a simple list of examinees', async () => {
      const mockExaminees = [{ id: 1, name: 'Andi' }];
      mockExamineeRepository.find.mockResolvedValue(mockExaminees);

      const result = await service.findAllSimple();

      expect(result).toEqual(mockExaminees);
      expect(repository.find).toHaveBeenCalledWith({
        select: ['id', 'name'],
        order: { name: 'ASC' },
      });
    });
  });
});
