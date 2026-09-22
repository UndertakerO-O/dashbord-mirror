import { Module } from '@nestjs/common';
import { WidgetsModule } from '../widgets/widgets.module';
import { DashboardService } from './dashboard.service';

// Le dashboard orchestre les widgets personnalisés de l’utilisateur connecté.
@Module({
  imports: [WidgetsModule],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
