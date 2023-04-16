import { Serialize } from '@/interceptors/serialize-interceptor';
import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserDto } from '../dtos/user.dto';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@Serialize(UserDto)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  createUser(@Body() body: CreateUserDto) {
    console.log(body);
    this.authService.register(
      body.email,
      body.password,
      body.username,
      body.firstName,
      body.lastName
    );
  }

  @Post('login')
  private login(@Body() body: LoginDto): Promise<string | never> {
    return this.authService.login(body);
  }
}
