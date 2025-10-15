import { PartialType } from '@nestjs/mapped-types';
import { CreateExamineeDto } from './create-examinee.dto';

export class UpdateExamineeDto extends PartialType(CreateExamineeDto) {}
