import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GitHubConnector } from './connectors/github.connector';
import { ServicesService } from './services.service';

// Les services représentent les intégrations externes disponibles dans le dashboard.
@Module({
  imports: [DatabaseModule],
  providers: [ServicesService, GitHubConnector],
  exports: [ServicesService],
})
export class ServicesModule {}
