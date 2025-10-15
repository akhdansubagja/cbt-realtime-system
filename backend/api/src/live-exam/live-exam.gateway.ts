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
}