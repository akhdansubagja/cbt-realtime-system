// src/live-exam/live-exam.gateway.ts

import { Inject, OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ClientKafka } from '@nestjs/microservices';
import { Server, Socket } from 'socket.io';
import { ParticipantStatus } from 'src/participants/entities/participant.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveExamGateway implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka, // <-- Pastikan constructor meng-inject ini
  ) {}

  @WebSocketServer()
  server: Server;

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('answer-submissions');
    await this.kafkaClient.connect();
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // --- PERBAIKAN DI SINI: HAPUS JSON.stringify() ---
    this.kafkaClient.emit('answer-submissions', data); // Kirim objeknya langsung

    console.log(`Jawaban dari ${client.id} dikirim ke Kafka:`, data);

    client.emit('answerReceived', {
      message: 'Jawaban Anda telah kami terima dan sedang diproses.',
      data: data, // Kirim objeknya juga ke klien
    });
  }

  broadcastScoreUpdate(
    examId: number,
    participantId: number,
    newScore: number,
  ) {
    const roomName = `exam-${examId}-monitoring`; // Buat nama ruangan yang unik

    // Kirim event 'score-update' HANYA ke admin yang ada di ruangan ini
    this.server.to(roomName).emit('score-update', {
      participantId,
      newScore,
    });

    console.log(
      `Menyiarkan update skor ke ruangan ${roomName}: Peserta ${participantId} skor baru ${newScore}`,
    );
  }

  @SubscribeMessage('join-monitoring-room')
  handleJoinMonitoringRoom(
    @MessageBody() data: { examId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `exam-${data.examId}-monitoring`;
    client.join(roomName); // Masukkan koneksi klien ini ke dalam ruangan
    console.log(
      `Klien ${client.id} bergabung ke ruangan monitoring: ${roomName}`,
    );
  }

  // Metode baru untuk menyiarkan peserta yang baru bergabung/memulai
  broadcastNewParticipant(
    examId: number,
    participantId: number,
    participantName: string,
  ) {
    const roomName = `exam-${examId}-monitoring`;

    // Siarkan event 'new-participant' ke ruangan monitoring
    this.server.to(roomName).emit('new-participant', {
      id: participantId,
      name: participantName,
      score: null, // Peserta baru belum punya skor
    });

    console.log(
      `Menyiarkan peserta baru ke ruangan ${roomName}: ${participantName} (ID: ${participantId})`,
    );
  }

  broadcastStatusUpdate(examId: number, participantId: number, newStatus: ParticipantStatus) {
  const roomName = `exam-${examId}-monitoring`;
  
  // Siarkan event 'status-update' ke ruangan monitoring
  this.server.to(roomName).emit('status-update', {
    participantId,
    newStatus,
  });

  console.log(`Menyiarkan update status ke ruangan ${roomName}: Peserta ${participantId} status baru ${newStatus}`);
}
}
