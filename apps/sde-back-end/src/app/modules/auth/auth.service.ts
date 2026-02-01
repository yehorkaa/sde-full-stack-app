import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto';
import { UserService } from '../user/user.service';
import { BcryptService } from '../common/services/bcrypt.service';
import jwtConfig from './config/jwt.config';
import { RefreshTokenStorage } from './storages/refresh-token.storage';
import { ActiveUserData } from './decorators/active-user.decorator';
import { UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenStorage: RefreshTokenStorage
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const existingUser = await this.userService.findByEmail(signUpDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await this.bcryptService.hash(signUpDto.password);

    const user = await this.userService.create({
      email: signUpDto.email,
      passwordHash,
      name: signUpDto.name,
    });

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.userService.findByEmail(signInDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.bcryptService.compare(
      signInDto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub: userId, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.refreshTokenStorage.validate(userId, refreshTokenId);
      await this.refreshTokenStorage.invalidate(userId, refreshTokenId);

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string, userId: string) {
    try {
      const { refreshTokenId } = await this.jwtService.verifyAsync<{
        refreshTokenId: string;
      }>(refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      await this.refreshTokenStorage.invalidate(userId, refreshTokenId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
  }

  private async generateTokens(user: UserDocument) {
    const refreshTokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user._id.toString(),
        this.jwtConfiguration.accessTokenTTL,
        { email: user.email }
      ),
      this.signToken(user._id.toString(), this.jwtConfiguration.refreshTokenTTL, {
        refreshTokenId,
      }),
    ]);

    await this.refreshTokenStorage.insert(user._id.toString(), refreshTokenId);

    return { accessToken, refreshToken };
  }

  private async signToken<T extends object>(
    userId: string,
    expiresIn: number,
    payload?: T
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      }
    );
  }
}
