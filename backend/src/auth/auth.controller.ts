import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

function sessionCookie(response: Response, token: string): void {
  response.cookie('dashboard_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  });
}

function sessionToken(request: Request): string | undefined {
  return request.headers.cookie
    ?.split(';')
    .find((cookie) => cookie.trim().startsWith('dashboard_session='))
    ?.trim()
    .slice('dashboard_session='.length);
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Get('confirm')
  async confirm(@Query('token') token: string) {
    await this.authService.confirm(token);
    return { message: 'Account confirmed' };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    sessionCookie(response, result.sessionToken);
    return { userId: result.userId };
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(sessionToken(request));
    response.clearCookie('dashboard_session', { path: '/' });
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { userId: request.userId };
  }
}
