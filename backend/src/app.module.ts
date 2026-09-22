import { Module } from '@nestjs/common';
import { AboutModule } from './about/about.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { WidgetsModule } from './widgets/widgets.module';

@Module({
  // Les modules correspondent aux domaines fonctionnels du Dashboard Project.
  imports: [
    DatabaseModule,
    AboutModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    WidgetsModule,
    DashboardModule,
  ],
})
export class AppModule {}
