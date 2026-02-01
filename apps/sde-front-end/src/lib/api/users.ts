import api from '../axios';
import type { User } from '@sde-challenge/shared-types';

export async function fetchUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users');
  return response.data;
}
