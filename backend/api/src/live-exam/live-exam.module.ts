import { Module, forwardRef } from '@nestjs/common';
import { LiveExamGateway } from './live-exam.gateway';
import { ParticipantsModule } from 'src/participants/participants.module';

@Module({
  imports: [forwardRef(() => ParticipantsModule)],
  providers: [LiveExamGateway],
  exports: [LiveExamGateway],
})
export class LiveExamModule {}
