import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { WidgetsService } from './widgets.service';
import { WidgetsController } from './widgets.controller';

@Module({
  imports: [ServicesModule, AuthModule],
  controllers: [WidgetsController],
  providers: [WidgetsService],
  exports: [WidgetsService],
})
export class WidgetsModule {}
