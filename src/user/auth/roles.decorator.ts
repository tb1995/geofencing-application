import { SetMetadata } from '@nestjs/common';

/**
 * Allows the @Roles() decorator to guard endpoints in the controllers
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
