import { Injectable } from '@nestjs/common';
import { CreateExamineeDto } from './dto/create-examinee.dto';
import { UpdateExamineeDto } from './dto/update-examinee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Examinee } from './entities/examinee.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExamineesService {
  constructor(
    @InjectRepository(Examinee)
    private readonly examineeRepository: Repository<Examinee>,
  ) {}

  create(createExamineeDto: CreateExamineeDto) {
    const newExaminee = this.examineeRepository.create(createExamineeDto);
    return this.examineeRepository.save(newExaminee);
  }

  findAll() {
    return this.examineeRepository.find({ order: { name: 'ASC' } });
  }

  findOne(id: number) {
    return this.examineeRepository.findOneBy({ id });
  }

  // --- LOGIKA UPDATE BARU ---
  async update(id: number, updateExamineeDto: UpdateExamineeDto) {
    await this.examineeRepository.update(id, updateExamineeDto);
    return this.examineeRepository.findOneBy({ id });
  }

  // --- LOGIKA DELETE BARU ---
  remove(id: number) {
    return this.examineeRepository.delete(id);
  }
}