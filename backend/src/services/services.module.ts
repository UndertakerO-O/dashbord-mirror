import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';

// Les services représentent les intégrations externes disponibles dans le dashboard.
@Module({
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
