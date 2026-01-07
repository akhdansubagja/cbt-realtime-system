// src/kafka/kafka.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.registerAsync([
      // <-- Gunakan registerAsync
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule], // <-- Beritahu bahwa kita butuh ConfigModule
        useFactory: async (configService: ConfigService) => ({
          // <-- Gunakan factory
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'cbt-app',
              // Ambil nilai SETELAH config dimuat
              brokers: [
                configService.get<string>(
                  'KAFKA_BROKER_URL',
                  'localhost:29092',
                ),
              ],
              // [KP-RESILIENCE] Timeout agar cepat sadar kalau Kafka mati
              connectionTimeout: 1000, // 1 detik (Lebih cepat sadar)
              authenticationTimeout: 1000,
              retry: {
                initialRetryTime: 300,
                retries: 1, // Fail fast! Biarkan Frontend yang melakukan loop retry.
              },
            },
            consumer: {
              groupId: 'cbt-consumer',
            },
          },
        }),
        inject: [ConfigService], // <-- Inject ConfigService ke dalam factory
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
