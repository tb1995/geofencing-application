import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './auth.dto';
import { AuthHelper } from './auth.helper';
import { CreateUserDto } from '../dtos/create-user.dto';

@Injectable()
export class AuthService {
  private logger = new Logger('Auth Service');

  @InjectRepository(User)
  private readonly repository: Repository<User>;

  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  public async register(
    email: string,
    password: string,
    username: string,
    firstName: string,
    lastName: string,
    role: 'organization' | 'consumer'
  ) {
    let user: User = await this.repository.findOne({ where: { email } });

    if (user) {
      this.logger.warn(
        `A duplicate account with email ID ${email} was attempted to be created`
      );
      throw new HttpException('Conflict', HttpStatus.CONFLICT);
    }

    user = this.repository.create({
      email,
      password,
      username,
      firstName,
      lastName,
      role,
    });
    user.password = this.helper.encodePassword(password);
    let createdUser = await this.repository.save(user).catch((error) => {
      this.logger.warn(error);
    });

    //@ts-ignore
    let userId = createdUser.id;
    this.logger.log(`User was created with ID ${userId}`);
    return userId;
  }

  public async findById(id: number) {
    return this.repository.findOneBy({ id });
  }

  public async findByEmail(email: string) {
    let user = await this.repository.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new NotFoundException('Could not find a user by this email');
    }
    return user;
  }

  public async deleteByEmail(email: string) {
    return this.repository
      .delete({
        email: email,
      })
      .catch((error) => {
        this.logger.warn(error);
      })
      .then(() => {
        this.logger.log(`User was deleted with email ${email}`);
      });
  }

  public async login(body: LoginDto): Promise<string | never> {
    const { email, password }: LoginDto = body;
    const user: User = await this.repository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('No user found');
    }

    const isPasswordValid: boolean = this.helper.isPasswordValid(
      password,
      user.password
    );

    if (!isPasswordValid) {
      this.logger.warn(`Account with email ${email} failed to log in`);
      throw new UnauthorizedException('Unauthorized');
    }

    this.repository.update(user.id, { lastLoginAt: new Date() });
    this.logger.log(`User with email ${email} successfully logged in`);
    return this.helper.generateToken(user);
  }

  public async refresh(user: User): Promise<string> {
    this.repository.update(user.id, { lastLoginAt: new Date() });

    return this.helper.generateToken(user);
  }
}
