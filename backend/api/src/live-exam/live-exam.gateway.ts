// src/live-exam/live-exam.gateway.ts

import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ParticipantStatus } from 'src/participants/entities/participant.entity';
import { ParticipantsService } from 'src/participants/participants.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveExamGateway implements OnModuleInit {
  constructor(
    @Inject(forwardRef(() => ParticipantsService))
    private readonly participantsService: ParticipantsService,
  ) {}

  @WebSocketServer()
  server: Server;

  async onModuleInit() {
    // Kafka subscription removed
  }

  handleConnection(client: Socket) {
    const participantId = client.handshake.query.participantId;
    if (participantId) {
      const roomName = `participant-${participantId}`;
      client.join(roomName);
    }
  }

  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // [NON-KAFKA REFACTOR] Direct Service Call
    // Instead of emitting to Kafka, we call the service directly.
    try {
      await this.participantsService.saveAnswer(data);
    } catch (error) {
      console.error('DIRECT CALL ERROR: Failed to save answer:', error);
      client.emit('answerFailed', {
        message: 'Gagal menyimpan jawaban (Error Server).',
        examQuestionId: data.examQuestionId,
      });
    }
  }

  broadcastScoreUpdate(
    examId: number,
    participantId: number,
    newScore: number,
  ) {
    const roomName = `exam-${examId}-monitoring`;
    this.server.to(roomName).emit('score-update', {
      participantId,
      newScore,
    });
  }

  @SubscribeMessage('join-monitoring-room')
  handleJoinMonitoringRoom(
    @MessageBody() data: { examId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `exam-${data.examId}-monitoring`;
    client.join(roomName);
  }

  broadcastNewParticipant(
    examId: number,
    participantId: number,
    participantName: string,
    batchName?: string,
    startTime?: Date,
  ) {
    const roomName = `exam-${examId}-monitoring`;
    this.server.to(roomName).emit('new-participant', {
      id: participantId,
      name: participantName,
      score: null,
      start_time: startTime,
      examinee: {
        batch: {
          name: batchName || 'Umum',
        },
      },
    });
  }

  broadcastStatusUpdate(
    examId: number,
    participantId: number,
    newStatus: ParticipantStatus,
    finishedAt?: Date,
  ) {
    const roomName = `exam-${examId}-monitoring`;
    this.server.to(roomName).emit('status-update', {
      participantId,
      newStatus,
      finished_at: finishedAt,
    });
  }
}
