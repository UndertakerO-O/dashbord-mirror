import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GitHubConnector } from './connectors/github.connector';
import { WeatherConnector } from './connectors/weather.connector';
import { ServicesService } from './services.service';

@Module({
  imports: [DatabaseModule],
  providers: [ServicesService, GitHubConnector, WeatherConnector],
  exports: [ServicesService],
})
export class ServicesModule {}
