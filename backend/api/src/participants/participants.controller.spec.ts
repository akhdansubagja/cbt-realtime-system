// cbt-realtime-system/backend/api/src/participants/participants.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { JoinExamDto } from './dto/join-exam.dto';

// Membuat mock/tiruan dari ParticipantsService
const mockParticipantsService = {
  joinExam: jest.fn(),
  getExamQuestions: jest.fn(),
  beginExam: jest.fn(),
  finishExam: jest.fn(),
  getParticipantAnswers: jest.fn(),
};

describe('ParticipantsController', () => {
  let controller: ParticipantsController;
  let service: ParticipantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipantsController],
      providers: [
        {
          provide: ParticipantsService,
          useValue: mockParticipantsService,
        },
      ],
    }).compile();

    controller = module.get<ParticipantsController>(ParticipantsController);
    service = module.get<ParticipantsService>(ParticipantsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('joinExam', () => {
    it('should call joinExam service method', async () => {
      const joinDto = new JoinExamDto();
      const expectedResult = { participant: {}, access_token: 'token' };
      mockParticipantsService.joinExam.mockResolvedValue(expectedResult);

      const result = await controller.joinExam(joinDto);

      expect(result).toEqual(expectedResult);
      expect(service.joinExam).toHaveBeenCalledWith(joinDto);
    });
  });

  describe('getExamQuestions', () => {
    it('should call getExamQuestions service method', async () => {
        const participantId = '1';
        await controller.getExamQuestions(participantId);
        expect(service.getExamQuestions).toHaveBeenCalledWith(+participantId);
    });
  });

  describe('beginExam', () => {
    it('should call beginExam service method', async () => {
        const participantId = '1';
        await controller.beginExam(participantId);
        expect(service.beginExam).toHaveBeenCalledWith(+participantId);
    });
  });

  describe('finishExam', () => {
    it('should call finishExam service method', async () => {
        const participantId = '1';
        await controller.finishExam(participantId);
        expect(service.finishExam).toHaveBeenCalledWith(+participantId);
    });
  });

  describe('getParticipantAnswers', () => {
    it('should call getParticipantAnswers service method', async () => {
        const participantId = '1';
        await controller.getParticipantAnswers(participantId);
        expect(service.getParticipantAnswers).toHaveBeenCalledWith(+participantId);
    });
  });
});