// backend/src/auth/interface/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../../users/domains/entities/user.entity';

/**
 * Custom decorator (@GetUser) untuk mengekstrak objek 'user'
 * yang telah ditambahkan ke request oleh 'AuthGuard'.
 *
 * @param data - Optional property name to extract from user object
 * @param ctx - Execution context
 * @returns User object or specific property if data is provided
 */
export const GetUser = createParamDecorator(
  (
    data: keyof User | undefined,
    ctx: ExecutionContext,
  ): User | User[keyof User] => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    // If specific property requested, return that property
    if (data) {
      return user[data];
    }

    // Otherwise return full user object
    return user;
  },
);
