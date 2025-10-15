// src/users/users.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- 1. IMPORT
import { User } from './entities/user.entity';    // <-- 2. IMPORT

@Module({
  imports: [TypeOrmModule.forFeature([User])], // <-- 3. TAMBAHKAN INI
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}