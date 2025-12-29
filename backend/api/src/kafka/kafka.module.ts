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
