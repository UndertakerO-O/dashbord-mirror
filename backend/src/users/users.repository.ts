import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, isConfirmed: true },
    });
  }

  create(data: { email: string; passwordHash: string; confirmationTokenHash: string; confirmationExpiresAt: Date }) {
    return this.prisma.user.create({ data });
  }
}
