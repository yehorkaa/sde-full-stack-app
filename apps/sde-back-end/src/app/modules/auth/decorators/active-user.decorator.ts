import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ActiveUserData {
  sub: string;
  email: string;
}

export const REQUEST_USER_KEY = 'user';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserData = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  }
);
