// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. PANGGIL CORS PERTAMA KALI
  app.enableCors({
    origin: true, // Izinkan frontend Anda
    credentials: true,
  });

  // 2. SETELAH CORS, BARU PANGGIL STATIC ASSETS (DENGAN PATH YANG BENAR)
  // Path ini (.. dari dist) akan mengarah ke folder 'uploads' di root 'api'
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 3. Sisa konfigurasi (Kafka, WebSockets)
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER_URL],
      },
      consumer: {
        groupId: 'cbt-consumer',
      },
    },
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  // 4. JALANKAN
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
