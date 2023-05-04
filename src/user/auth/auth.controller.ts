import { Serialize } from '../../interceptors/serialize-interceptor';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Express } from 'express';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserDto } from '../dtos/user.dto';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './auth.guard';
import { User } from '../user.entity';

@Serialize(UserDto)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async createUser(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    if (body.role !== 'organization' && body.role !== 'consumer') {
      throw new BadRequestException('Missing or Incorrect Role Type');
    }
    let createdUser = await this.authService.register(
      body.email,
      body.password,
      body.username,
      body.firstName,
      body.lastName,
      body.role
    );
    if (createdUser) {
      res.status(HttpStatus.OK).json({
        status: 'OK',
        message: `User created with ID: ${createdUser}`,
      });
    }
    throw new BadRequestException('Could not upload user');
  }

  @Post('login')
  login(@Body() body: LoginDto): Promise<string | never> {
    return this.authService.login(body);
  }
}
