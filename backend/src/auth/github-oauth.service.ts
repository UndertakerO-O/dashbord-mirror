import { ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { encryptOAuthToken } from './oauth-token.crypto';

const PROVIDER = 'github';
const STATE_DURATION_MS = 10 * 60 * 1000;

@Injectable()
export class GitHubOAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async createAuthorizationUrl(userId?: number): Promise<string> {
    const config = this.configuration();
    const state = randomBytes(32).toString('hex');
    await this.prisma.oAuthState.create({
      data: { userId, stateHash: this.hash(state), expiresAt: new Date(Date.now() + STATE_DURATION_MS) },
    });
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async completeAuthorization(code: string, state: string): Promise<{ userId: number; login: boolean } | null> {
    if (!code || !state) throw new ServiceUnavailableException('GitHub authorization is incomplete');
    const config = this.configuration();
    const stateRecord = await this.prisma.oAuthState.findUnique({ where: { stateHash: this.hash(state) } });
    if (!stateRecord || stateRecord.expiresAt <= new Date()) throw new ServiceUnavailableException('GitHub authorization state is invalid or expired');
    await this.prisma.oAuthState.delete({ where: { id: stateRecord.id } });

    const accessToken = await this.exchangeCode(code, config.clientId, config.clientSecret, config.redirectUri);
    const profile = await this.githubRequest<{ id: number }>('/user', accessToken);
    const existing = await this.prisma.oAuthConnection.findUnique({
      where: { provider_providerAccountId: { provider: PROVIDER, providerAccountId: String(profile.id) } },
    });

    if (!stateRecord.userId) {
      if (!existing) return null;
      await this.prisma.oAuthConnection.update({
        where: { id: existing.id },
        data: { accessTokenCipher: encryptOAuthToken(accessToken) },
      });
      return { userId: existing.userId, login: true };
    }

    if (existing && existing.userId !== stateRecord.userId) {
      throw new ConflictException('This GitHub account is already linked to another user');
    }

    await this.prisma.oAuthConnection.upsert({
      where: { userId_provider: { userId: stateRecord.userId, provider: PROVIDER } },
      create: {
        userId: stateRecord.userId,
        provider: PROVIDER,
        providerAccountId: String(profile.id),
        accessTokenCipher: encryptOAuthToken(accessToken),
      },
      update: {
        providerAccountId: String(profile.id),
        accessTokenCipher: encryptOAuthToken(accessToken),
      },
    });
    return { userId: stateRecord.userId, login: false };
  }

  async isConnected(userId: number): Promise<boolean> {
    const connection = await this.prisma.oAuthConnection.findUnique({
      where: { userId_provider: { userId, provider: PROVIDER } },
      select: { id: true },
    });
    return Boolean(connection);
  }

  async disconnect(userId: number): Promise<void> {
    await this.prisma.oAuthConnection.deleteMany({ where: { userId, provider: PROVIDER } });
  }

  private configuration() {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) throw new ServiceUnavailableException('GitHub OAuth is not configured');
    return { clientId, clientSecret, redirectUri };
  }

  private async exchangeCode(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'dashboard-project' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
    });
    const data = (await response.json()) as { access_token?: string; error_description?: string };
    if (!response.ok || !data.access_token) throw new ServiceUnavailableException(data.error_description ?? 'GitHub token exchange failed');
    return data.access_token;
  }

  private async githubRequest<T>(path: string, accessToken: string): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${accessToken}`, 'User-Agent': 'dashboard-project' },
    });
    if (!response.ok) throw new ServiceUnavailableException('GitHub profile request failed');
    return (await response.json()) as T;
  }

  private hash(value: string): string { return createHash('sha256').update(value).digest('hex'); }
}
