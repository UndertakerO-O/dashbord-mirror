import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('about.json')
export class AboutController {
  @Get()
  getAbout(@Req() request: Request) {
    return {
      client: {
        host: request.socket.remoteAddress?.replace('::ffff:', '') ?? 'unknown',
      },
      server: {
        current_time: Math.floor(Date.now() / 1000),
        services: [],
      },
    };
  }
}
