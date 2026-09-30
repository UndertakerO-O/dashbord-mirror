import { Module } from '@nestjs/common';
import { WidgetsModule } from '../widgets/widgets.module';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [WidgetsModule],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
