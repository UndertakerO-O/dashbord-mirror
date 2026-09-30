import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module';
import { WidgetsService } from './widgets.service';

@Module({
  imports: [ServicesModule],
  providers: [WidgetsService],
  exports: [WidgetsService],
})
export class WidgetsModule {}
