// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Transport } from '@nestjs/microservices'; // <-- 1. IMPORT TRANSPORT

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 2. KONFIGURASI KAFKA CONSUMER
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER_URL],
      },
      consumer: {
        groupId: 'cbt-consumer', // Pastikan groupId sama dengan di kafka.module
      },
    },
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  await app.startAllMicroservices(); // <-- 3. JALANKAN SEMUA MICROSERVICES
  await app.listen(3000); // <-- JALANKAN SERVER WEB
}
bootstrap();  