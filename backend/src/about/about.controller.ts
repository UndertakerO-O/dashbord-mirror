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
        services: [
          {
            name: 'github',
            widgets: [
              { name: 'recent_commits', description: 'Display recent commits from a repository', params: [{ name: 'repository', type: 'string' }, { name: 'number', type: 'integer' }] },
              { name: 'open_pull_requests', description: 'Display open pull requests from a repository', params: [{ name: 'repository', type: 'string' }, { name: 'number', type: 'integer' }] },
              { name: 'open_issues', description: 'Display open issues from a repository', params: [{ name: 'repository', type: 'string' }, { name: 'number', type: 'integer' }] },
            ],
          },
        ],
      },
    };
  }
}
