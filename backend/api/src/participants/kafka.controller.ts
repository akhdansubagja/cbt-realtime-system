// src/participants/kafka.controller.ts

import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ParticipantsService } from './participants.service';

interface SubmitAnswerPayload {
  participantId: number;
  examQuestionId: number;
  answer: string;
}

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);

  constructor(private readonly participantsService: ParticipantsService) {}

  /**
   * Handler untuk event 'answer-submissions' dari Kafka.
   * Menerima jawaban peserta dan menyimpannya ke database.
   *
   * @param data Payload jawaban.
   */
  @EventPattern('answer-submissions')
  handleAnswerSubmission(@Payload() data: SubmitAnswerPayload) {
    // Tidak perlu parsing, NestJS sudah melakukannya untuk kita!
    this.logger.log(
      `Pesan diterima & diproses dari Kafka: ${JSON.stringify(data)}`,
    );
    this.participantsService.saveAnswer(data);
  }
}
