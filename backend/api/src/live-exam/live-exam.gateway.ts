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

  /**
   * Menangani koneksi baru WebSocket.
   * @param client Socket client.
   */
  handleConnection(client: Socket) {
    // [REFACK-001] Identifikasi user saat koneksi
    const participantId = client.handshake.query.participantId;
    if (participantId) {
      const roomName = `participant-${participantId}`;
      client.join(roomName);
      // console.log(`Client ${client.id} joined room ${roomName}`);
    }
  }

  /**
   * Menangani pemutusan koneksi WebSocket.
   * @param client Socket client.
   */
  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Menerima submisi jawaban dari peserta ujian.
   * Meneruskan data ke Kafka. TIDAK LAGI MEMBERI ACK PALSU DI SINI.
   *
   * @param data Data jawaban yang dikirim peserta.
   * @param client Socket client.
   */
  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // [KP-RESILIENCE] Menggunakan Pola Observable untuk mendeteksi Error Kafka
    // Jika Kafka mati (Broker/Zookeeper down), error akan tertangkap di sini.
    this.kafkaClient.emit('answer-submissions', data).subscribe({
      next: () => {
        // Berhasil masuk antrian Kafka.
        // [REFACTOR-CONSISTENCY] JANGAN KIRIM ACK 'answerReceived' DI SINI.
        // Kita tunggu sampai Consumer berhasil menyimpan ke DB barulah kirim 'answerCommitted'.
      },
      error: (err) => {
        console.error('KAFKA ERROR: Gagal mengirim jawaban:', err);
        // Beritahu frontend bahwa penyimpanan GAGAL (karena Kafka mati)
        client.emit('answerFailed', {
          message:
            'Gagal menyimpan jawaban (Masalah Jaringan/Server). Coba lagi.',
          examQuestionId: data.examQuestionId, // Sertakan ID agar frontend tahu mana yang gagal
        });
      },
    });
  }

  /**
   * Menyiarkan update skor peserta ke room monitoring ujian (Admin).
   *
   * @param examId ID ujian.
   * @param participantId ID peserta.
   * @param newScore Skor terbaru.
   */
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

    // console.log(
    //   `Menyiarkan update skor ke ruangan ${roomName}: Peserta ${participantId} skor baru ${newScore}`,
    // );
  }

  /**
   * Mengizinkan admin/pengawas bergabung ke room monitoring ujian tertentu.
   *
   * @param data Object berisi examId.
   * @param client Socket client.
   */
  @SubscribeMessage('join-monitoring-room')
  handleJoinMonitoringRoom(
    @MessageBody() data: { examId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `exam-${data.examId}-monitoring`;
    client.join(roomName); // Masukkan koneksi klien ini ke dalam ruangan
    // console.log(
    //   `Klien ${client.id} bergabung ke ruangan monitoring: ${roomName}`,
    // );
  }

  /**
   * Menyiarkan notifikasi peserta baru yang memulai ujian.
   *
   * @param examId ID ujian.
   * @param participantId ID peserta.
   * @param participantName Nama peserta.
   * @param batchName Nama batch peserta.
   * @param startTime Waktu mulai.
   */
  broadcastNewParticipant(
    examId: number,
    participantId: number,
    participantName: string,
    batchName?: string,
    startTime?: Date,
  ) {
    const roomName = `exam-${examId}-monitoring`;

    // Siarkan event 'new-participant' ke ruangan monitoring
    this.server.to(roomName).emit('new-participant', {
      id: participantId,
      name: participantName,
      score: null, // Peserta baru belum punya skor
      start_time: startTime, // Kirim waktu mulai
      examinee: {
        batch: {
          name: batchName || 'Umum',
        },
      },
    });

    // console.log(
    //   `Menyiarkan peserta baru ke ruangan ${roomName}: ${participantName} (Batch: ${batchName})`,
    // );
  }

  /**
   * Menyiarkan update status peserta (Selesai, Diskualifikasi, dll).
   *
   * @param examId ID ujian.
   * @param participantId ID peserta.
   * @param newStatus Status baru.
   * @param finishedAt Waktu selesai (jika ada).
   */
  broadcastStatusUpdate(
    examId: number,
    participantId: number,
    newStatus: ParticipantStatus,
    finishedAt?: Date,
  ) {
    const roomName = `exam-${examId}-monitoring`;

    // Siarkan event 'status-update' ke ruangan monitoring
    this.server.to(roomName).emit('status-update', {
      participantId,
      newStatus,
      finished_at: finishedAt, // Kirim waktu selesai
    });

    // console.log(
    //   `Menyiarkan update status ke ruangan ${roomName}: Peserta ${participantId} status baru ${newStatus}`,
    // );
  }
}
