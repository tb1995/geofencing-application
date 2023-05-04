import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../user.service';

/**
 * Class to implement the role guard
 * compares the user's role with the defined list of authorized roles
 * for the endpoint
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private userService: UserService) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    const request = context.switchToHttp().getRequest();

    if (request?.user) {
      const user = request.user;

      return roles.includes(user.role);
    }

    return false;
  }
}
