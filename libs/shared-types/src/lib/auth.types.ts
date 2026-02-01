import { User } from './user.types';

export interface SignUpDto {
  email: string;
  password: string;
  name: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  user?: User;
  refreshToken: string;
}

export interface ActiveUserPayload {
  sub: string;
  email: string;
}
