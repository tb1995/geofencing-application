import { GeofenceService } from '../../geofence/geofence.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Geometry } from 'typeorm';
import { UserService } from '../user.service';
import { AuthService } from './auth.service';
import { UserModule } from '../user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import entities from '../../typeorm';
import { AuthHelper } from './auth.helper';
import * as bcrypt from 'bcryptjs';
import {
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

const TEST_EMAIL = 'test1@gmail.com';
const TEST_PASSWORD = 'password';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const fakeUsersService: Partial<AuthService> = {
      findById: (number) =>
        Promise.resolve({
          id: number,
          email: 'test@gmail.com',
          role: 'consumer',
        } as User),
      register: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password: password } as User),
    };

    const fakeGeofenceService = {
      find: () => Promise.resolve([]),
      create: (name: string, location: Geometry) =>
        Promise.resolve({ id: 1, name, location }),
    };

    const fakeAuthHelper: Partial<AuthHelper> = {
      encodePassword: (password: string) => {
        const salt: string = bcrypt.genSaltSync(10);

        return bcrypt.hashSync(password, salt);
      },

      isPasswordValid: (password: string, userPassword: string) => {
        return password === TEST_PASSWORD;
      },

      generateToken: () => {
        return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQiLCJlbWFpbCI6InRiMTk5NUBnbWFpbC5jb20iLCJpYXQiOjE2ODIyNjk4MjYsImV4cCI6MTcxMzgwNTgyNn0.Kv7jncIL4h3Gp9WV7r9g5ZqYHLgCmXZe8_H1wRJ_DPg';
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        ConfigService,
        {
          provide: UserService,
          useValue: fakeUsersService,
        },
        {
          provide: GeofenceService,
          useValue: fakeGeofenceService,
        },
        {
          provide: AuthHelper,
          useValue: fakeAuthHelper,
        },
      ],
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST'),
            port: +configService.get<number>('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: 'test_geoapp',
            entities: entities,
            synchronize: true,
            autoLoadEntities: true,
          }),

          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([User]),
        UserModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: `.env.${process.env.NODE_ENV}`,
        }),
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('can create a new user with a salted and hashed password', async () => {
    const user = await service.register(
      TEST_EMAIL,
      TEST_PASSWORD,
      'test',
      'firstName',
      'lastName',
      'consumer'
    );
    expect(user.password).not.toEqual(TEST_PASSWORD);
  });

  it('can not create a user with a duplicate email', async () => {
    await expect(
      service.register(
        TEST_EMAIL,
        TEST_PASSWORD,
        'test',
        'firstName',
        'lastName',
        'consumer'
      )
    ).rejects.toThrow(HttpException);
  });

  it('can return a JWT access token on successful login', async () => {
    expect(
      await service.login({ email: TEST_EMAIL, password: TEST_PASSWORD })
    ).toContain('ey');
  });

  it('can return notfound on incorrect email', async () => {
    expect(
      async () =>
        await service.login({
          email: 'TEST_EMAIL',
          password: TEST_PASSWORD,
        })
    ).rejects.toThrow(NotFoundException);
  });

  it('can return unauthorized on incorrect password', async () => {
    expect(
      async () =>
        await service.login({
          email: TEST_EMAIL,
          password: 'TEST_PASSWORD + 1',
        })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('can delete a user', async () => {
    await service.deleteByEmail(TEST_EMAIL);

    expect(async () => await service.findByEmail(TEST_EMAIL)).rejects.toThrow(
      NotFoundException
    );
  });
});
