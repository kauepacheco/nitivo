import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SESSION_COOKIE } from './auth.constants';
import { LoginDto, SetPasswordDto } from './auth.dto';
import { CsrfGuard } from './csrf.guard';
import { SessionGuard } from './session.guard';
import type { AuthenticatedRequest } from './auth.types';

@ApiTags('Acesso da equipe')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('set-password')
  @HttpCode(204)
  @ApiNoContentResponse()
  async setPassword(
    @Body() input: SetPasswordDto,
    @Ip() remoteAddress: string,
  ) {
    await this.authService.setPassword(
      input.token,
      input.password,
      remoteAddress,
    );
  }

  @Post('reset-password')
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Senha redefinida e sessões anteriores revogadas',
  })
  async resetPassword(
    @Body() input: SetPasswordDto,
    @Ip() remoteAddress: string,
  ) {
    await this.authService.resetPassword(
      input.token,
      input.password,
      remoteAddress,
    );
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Sessão iniciada' })
  async login(
    @Body() input: LoginDto,
    @Ip() remoteAddress: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const login = await this.authService.login(
      input.email,
      input.password,
      remoteAddress,
    );
    response.cookie(SESSION_COOKIE, login.rawSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: login.expiresAt,
    });
    return { csrfToken: login.csrfToken, user: login.user };
  }

  @Get('session')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('nitivo_session')
  session(@Req() request: AuthenticatedRequest) {
    return {
      csrfToken: request.authSession!.csrfToken,
      user: {
        email: request.authSession!.email,
        memberships: request.authSession!.memberships,
      },
    };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionGuard, CsrfGuard)
  @ApiCookieAuth('nitivo_session')
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiNoContentResponse()
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.authSession!.id);
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
}
