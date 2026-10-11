import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../database/prisma.service';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { MailService } from '../mail/mail.service';

const scrypt = promisify(scryptCallback);
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.usersRepository.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const confirmationToken = randomBytes(32).toString('hex');
    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.usersRepository.create({
      email,
      passwordHash,
      confirmationTokenHash: this.hashToken(confirmationToken),
      confirmationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    await this.mailService.sendConfirmationEmail(user.email, confirmationToken);
    return { id: user.id, email: user.email, message: 'Confirmation email sent' };
  }

  async confirm(token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { confirmationTokenHash: this.hashToken(token) },
    });

    if (!user || !user.confirmationExpiresAt || user.confirmationExpiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired confirmation token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isConfirmed: true, confirmationTokenHash: null, confirmationExpiresAt: null },
    });
  }

  async login(dto: LoginDto): Promise<{ sessionToken: string; userId: number }> {
    const user = await this.usersRepository.findByEmail(dto.email.trim().toLowerCase());
    if (!user || !(await this.verifyPassword(dto.password, user.passwordHash)) || !user.isConfirmed) {
      throw new UnauthorizedException('Invalid credentials or unconfirmed account');
    }

    const sessionToken = await this.createSession(user.id);
    return { sessionToken, userId: user.id };
  }

  async createSession(userId: number): Promise<string> {
    const sessionToken = randomBytes(32).toString('hex');
    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hashToken(sessionToken),
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });
    return sessionToken;
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (sessionToken) {
      await this.prisma.session.deleteMany({ where: { tokenHash: this.hashToken(sessionToken) } });
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, key] = storedHash.split(':');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedKey = Buffer.from(key, 'hex');
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  }
}
