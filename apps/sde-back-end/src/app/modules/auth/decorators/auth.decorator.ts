import { SetMetadata } from '@nestjs/common';

export enum AuthType {
  BEARER = 'bearer',
  NONE = 'none',
}

export const AUTH_TYPE_KEY = 'authType';

export const Auth = (...authTypes: AuthType[]) =>
  SetMetadata(AUTH_TYPE_KEY, authTypes);
