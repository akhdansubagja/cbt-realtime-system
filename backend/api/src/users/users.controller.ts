// src/users/users.controller.ts

import { Controller, Post, Body } from '@nestjs/common'; // <-- IMPORT INI YANG PALING PENTING
import { UsersService } from './users.service'; // <-- IMPORT UNTUK SERVICE
import { CreateUserDto } from './dto/create-user.dto'; // <-- IMPORT UNTUK DTO

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}