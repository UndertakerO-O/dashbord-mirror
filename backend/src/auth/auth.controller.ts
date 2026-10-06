import { Body, Controller, Delete, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { GitHubOAuthService } from './github-oauth.service';
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
  constructor(
    private readonly authService: AuthService,
    private readonly githubOAuthService: GitHubOAuthService,
  ) {}

  @Get('github/login')
  async githubLogin(@Res() response: Response) {
    response.redirect(await this.githubOAuthService.createAuthorizationUrl());
  }

  @Get('github')
  @UseGuards(AuthGuard)
  async github(@Req() request: AuthenticatedRequest, @Res() response: Response) {
    response.redirect(await this.githubOAuthService.createAuthorizationUrl(request.userId));
  }

  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() response: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    if (error) return response.redirect(`${frontendUrl}/dashboard?github=cancelled`);
    const result = await this.githubOAuthService.completeAuthorization(code, state);
    if (!result) return response.redirect(`${frontendUrl}/login?github=not-linked`);
    if (result.login) sessionCookie(response, await this.authService.createSession(result.userId));
    return response.redirect(`${frontendUrl}/dashboard?github=connected`);
  }

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

  @Get('github/status')
  @UseGuards(AuthGuard)
  async githubStatus(@Req() request: AuthenticatedRequest) {
    return { connected: await this.githubOAuthService.isConnected(request.userId) };
  }

  @Delete('github')
  @UseGuards(AuthGuard)
  async disconnectGithub(@Req() request: AuthenticatedRequest) {
    await this.githubOAuthService.disconnect(request.userId);
    return { message: 'GitHub disconnected' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { userId: request.userId };
  }
}
