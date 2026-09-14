import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, AcceptInviteDto } from './dto';
import { Public, CurrentUser, AuthUser } from '../common/decorators';

const REFRESH_COOKIE = 'sm_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    const secure = this.config.get<boolean>('cookie.secure') ?? false;
    const sameSite = this.config.get<'lax' | 'strict' | 'none'>('cookie.sameSite') ?? 'lax';
    const domain = this.config.get<string>('cookie.domain');
    const ttlDays = this.config.get<number>('jwt.refreshTtlDays') ?? 30;
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/api/auth',
      maxAge: ttlDays * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { tokens, refreshToken } = await this.auth.login(dto.email.toLowerCase(), dto.password);
    this.setRefreshCookie(res, refreshToken);
    return tokens;
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const { tokens, refreshToken } = await this.auth.refresh(raw);
    this.setRefreshCookie(res, refreshToken);
    return tokens;
  }

  @Public()
  @Post('accept-invite')
  async acceptInvite(@Body() dto: AcceptInviteDto, @Res({ passthrough: true }) res: Response) {
    const { tokens, refreshToken } = await this.auth.acceptInvite(dto.token, dto.name, dto.password);
    this.setRefreshCookie(res, refreshToken);
    return tokens;
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }
}
