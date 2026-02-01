import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto';
import { Auth, AuthType } from './decorators/auth.decorator';
import { ActiveUser, ActiveUserData } from './decorators/active-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth(AuthType.NONE)
  @Post('sign-up')
  async signUp(
    @Res({ passthrough: true }) response: Response,
    @Body() signUpDto: SignUpDto
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.signUp(signUpDto);

    response.cookie('accessToken', accessToken, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600 * 1000, // 1 hour
    });

    return { user, refreshToken };
  }

  @Auth(AuthType.NONE)
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signInDto: SignInDto
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.signIn(signInDto);

    response.cookie('accessToken', accessToken, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600 * 1000,
    });

    return { user, refreshToken };
  }

  @Auth(AuthType.NONE)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @Res({ passthrough: true }) response: Response,
    @Body() refreshTokenDto: RefreshTokenDto
  ) {
    const { accessToken, refreshToken } =
      await this.authService.refreshToken(refreshTokenDto);

    response.cookie('accessToken', accessToken, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600 * 1000,
    });

    return { refreshToken };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @ActiveUser() user: ActiveUserData,
    @Res({ passthrough: true }) response: Response,
    @Body() body: RefreshTokenDto
  ) {
    await this.authService.logout(body.refreshToken, user.sub);
    response.clearCookie('accessToken');
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  async getMe(@ActiveUser() user: ActiveUserData) {
    return this.authService.getMe(user.sub);
  }
}
