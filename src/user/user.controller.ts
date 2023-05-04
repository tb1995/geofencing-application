import {
  BadRequestException,
  Controller,
  Delete,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { User } from './user.entity';
import { Request, Response, Express } from 'express';

@Controller('users')
export class UserController {
  constructor(private authService: AuthService) {}
  @Delete('')
  @UseGuards(JwtAuthGuard)
  delete(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user: User = <User>req.user;
    const deletedUser = this.authService.deleteByEmail(user.email);

    if (deletedUser) {
      res.status(HttpStatus.OK).json({
        status: 'OK',
        message: `User deleted with ID: ${user.id}`,
      });
    }
    throw new BadRequestException('Could not delete user');
  }
}
