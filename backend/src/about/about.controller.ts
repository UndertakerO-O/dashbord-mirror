import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('about.json')
export class AboutController {
  @Get()
  getAbout(@Req() request: Request) {
    // Ce catalogue décrit les services et widgets utilisables par le frontend.
    return {
      client: {
        host: request.socket.remoteAddress?.replace('::ffff:', '') ?? 'unknown',
      },
      server: {
        current_time: Math.floor(Date.now() / 1000),
        services: [
          {
            name: 'weather',
            widgets: [
              {
                name: 'city_temperature',
                description: 'Display the current temperature for a city',
                params: [{ name: 'city', type: 'string' }],
              },
              {
                name: 'city_forecast',
                description: 'Display the forecast for a city',
                params: [{ name: 'city', type: 'string' }],
              },
            ],
          },
          {
            name: 'rss',
            widgets: [
              {
                name: 'article_list',
                description: 'Display the latest articles from a feed',
                params: [
                  { name: 'link', type: 'string' },
                  { name: 'number', type: 'integer' },
                ],
              },
            ],
          },
          {
            name: 'github',
            widgets: [
              {
                name: 'recent_commits',
                description: 'Display recent commits from a repository',
                params: [
                  { name: 'repository', type: 'string' },
                  { name: 'number', type: 'integer' },
                ],
              },
            ],
          },
        ],
      },
    };
  }
}
