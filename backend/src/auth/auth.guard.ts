import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';

export interface AuthenticatedRequest extends Request {
  userId: number;
}

function readCookie(request: Request, name: string): string | undefined {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const value = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return value?.trim().slice(name.length + 1);
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionToken = readCookie(request, 'dashboard_session');

    if (!sessionToken) {
      throw new UnauthorizedException();
    }

    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException();
    }

    request.userId = session.userId;
    return true;
  }
}
