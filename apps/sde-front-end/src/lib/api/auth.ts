import api from '../axios';
import type {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  AuthResponse,
  User,
} from '@sde-challenge/shared-types';

export async function signUp(data: SignUpDto): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/sign-up', data);
  return response.data;
}

export async function signIn(data: SignInDto): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/sign-in', data);
  return response.data;
}

export async function refreshToken(data: RefreshTokenDto): Promise<{ refreshToken: string }> {
  const response = await api.post<{ refreshToken: string }>(
    '/auth/refresh-token',
    data
  );
  return response.data;
}

export async function logout(data: RefreshTokenDto): Promise<void> {
  await api.post('/auth/logout', data);
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}
