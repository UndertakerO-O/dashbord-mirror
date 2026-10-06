import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { decryptOAuthToken } from '../../auth/oauth-token.crypto';
import { ServiceConnector } from './service-connector.interface';

@Injectable()
export class GitHubConnector implements ServiceConnector {
  readonly serviceName = 'github';

  constructor(private readonly prisma: PrismaService) {}

  async fetchData(userId: number, widgetName: string, configuration: Record<string, unknown>): Promise<unknown> {
    const connection = await this.prisma.oAuthConnection.findUnique({
      where: { userId_provider: { userId, provider: this.serviceName } },
    });
    if (!connection) throw new NotFoundException('GitHub is not connected');

    const token = decryptOAuthToken(connection.accessTokenCipher);
    const number = this.limit(configuration.number);
    const repository = this.repository(configuration.repository);
    if (widgetName === 'recent_commits') {
      return this.githubRequest(`/repos/${repository}/commits?per_page=${number}`, token);
    }
    if (widgetName === 'open_pull_requests') {
      return this.githubRequest(`/repos/${repository}/pulls?state=open&per_page=${number}`, token);
    }
    if (widgetName === 'open_issues') {
      return this.githubRequest(`/repos/${repository}/issues?state=open&per_page=${number}`, token);
    }
    throw new NotFoundException('Unknown GitHub widget');
  }

  private repository(value: unknown): string {
    if (typeof value !== 'string' || !/^[^/]+\/[^/]+$/.test(value)) {
      throw new ServiceUnavailableException('repository must use the owner/name format');
    }
    return value;
  }

  private limit(value: unknown): number {
    const number = Number(value ?? 5);
    return Number.isInteger(number) ? Math.min(Math.max(number, 1), 20) : 5;
  }

  private async githubRequest(path: string, token: string): Promise<unknown> {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'dashboard-project',
      },
    });
    if (!response.ok) throw new ServiceUnavailableException('GitHub API request failed');
    return response.json();
  }
}
