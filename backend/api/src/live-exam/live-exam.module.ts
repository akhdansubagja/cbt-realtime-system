// src/live-exam/live-exam.module.ts

import { Module } from '@nestjs/common';
import { LiveExamGateway } from './live-exam.gateway';
import { KafkaModule } from 'src/kafka/kafka.module'; 

@Module({
    imports: [KafkaModule], // Impor modul Kafka di sini
    providers: [LiveExamGateway], // Daftarkan gateway di sini
    exports: [LiveExamGateway],
})
export class LiveExamModule {}