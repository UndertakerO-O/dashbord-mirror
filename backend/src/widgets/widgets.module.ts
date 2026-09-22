import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module';
import { WidgetsService } from './widgets.service';

// Un widget utilise un service externe, mais reste configurable par l’utilisateur.
@Module({
  imports: [ServicesModule],
  providers: [WidgetsService],
  exports: [WidgetsService],
})
export class WidgetsModule {}
