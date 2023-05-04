import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '../user/auth/auth.service';
import { UserService } from '../user/user.service';
import entities, { User } from '../typeorm';
import { EventModule } from './event.module';
import { EventService } from './event.service';
import { MailService } from '../mail/mail.service';
import { UpdateEventDto } from './dtos/update-event.dto';
import { threadId } from 'worker_threads';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { log } from 'console';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '../user/auth/auth.strategy';
import { CreateEventDto } from './dtos/create-event.dto';
import { AuthHelper } from '../user/auth/auth.helper';
import * as bcrypt from 'bcryptjs';

const TEST_EVENT_NAME = 'test event name';
const TEST_EVENT_TIME = new Date();
const TEST_EVENT_LATITUDE = 33.7224;
const TEST_EVENT_LONGITUDE = 73.0597;
let TEST_CREATED_EVENT_ID = 0;
const TEST_USER = { id: 1 } as User;
const TEST_USER_SECOND = { id: 2 } as User;
const TEST_USER_THIRD = { id: 3 } as User;

const TEST_USER_CONSUMER = {
  email: 'tb1919@gmail.com',
  username: 'talha94',
  password: 'password',
  lol: 'lol',
  firstName: 'Talha',
  lastName: 'Hasan',
  role: 'consumer',
};

let CREATED_USER = new User();
let CREATED_USER_2 = new User();
let CREATED_ORGANIZATION_2 = new User();

const TEST_USER_ORGANIZATION = {
  email: 'tb1921@gmail.com',
  username: 'talha94',
  password: 'password',
  lol: 'lol',
  firstName: 'Talha',
  lastName: 'Hasan',
  role: 'organization',
};

const TEST_USER_ORGANIZATION_2 = {
  email: 'tb1922@gmail.com',
  username: 'talha94',
  password: 'password',
  lol: 'lol',
  firstName: 'Talha',
  lastName: 'Hasan',
  role: 'organization',
};

const TEST_USER_LOGIN_CONSUMER = {
  email: 'tb1919@gmail.com',
  password: 'password',
};

const TEST_USER_LOGIN_ORGANIZATION = {
  email: 'tb1921@gmail.com',
  password: 'password',
};

const TEST_USER_LOGIN_ORGANIZATION_2 = {
  email: 'tb1922@gmail.com',
  password: 'password',
};

const TEST_EVENT = {
  name: 'Another Iftar at Pappasalis',
  longitude: 73.0597,
  latitude: 33.7224,
  time: new Date(),
} as CreateEventDto;

const TEST_UPDATED_EVENT = {
  name: 'Updated Event at Pappasalis',
  longitude: 73.0597,
  latitude: 43.7224,
  time: '2023-04-17T11:05:19.989Z',
} as UpdateEventDto;

let TESTED_CONSUMER_LOGIN_JWT = '';
let TESTED_ORGANIZATION_LOGIN_JWT = '';
let TESTED_ORGANIZATION_2_LOGIN_JWT = '';

let TESTED_CONSUMER_USER_ID = 0;

const TEST_PASSWORD = 'password';

describe('EventService', () => {
  let service: EventService;
  let authService: AuthService;

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('can create an event', async () => {
    // @ts-ignore
    TEST_CREATED_EVENT_ID = await service.create(
      TEST_EVENT_NAME,
      TEST_EVENT_LATITUDE,
      TEST_EVENT_LONGITUDE,
      TEST_EVENT_TIME,
      CREATED_USER
    );

    expect(service).toBeDefined();
  });

  it('can read an event', async () => {
    const event = await service.findEventById(TEST_CREATED_EVENT_ID);
    expect(event).toBeDefined();
    expect(event.id).toBeDefined();
  });

  it('can update an event name and time', async () => {
    const event = await service.findEventById(TEST_CREATED_EVENT_ID);

    const updateEventDto = {
      name: 'updated test name',
    } as UpdateEventDto;

    await service.update(updateEventDto, TEST_CREATED_EVENT_ID, CREATED_USER);
    const updatedEvent = await service.findEventById(TEST_CREATED_EVENT_ID);

    expect(event.name === updatedEvent.name).toBe(false);
  });

  it('can update an event location', async () => {
    const event = await service.findEventById(TEST_CREATED_EVENT_ID);

    const updateEventDto = {
      latitude: 50,
      longitude: 50,
    } as UpdateEventDto;

    service.update(updateEventDto, TEST_CREATED_EVENT_ID, CREATED_USER);
    const updatedEvent = await service.findEventById(TEST_CREATED_EVENT_ID);
    expect(event.location === updatedEvent.location).toBe(false);
  });

  it('cannot update an event as unauthorized owner', async () => {
    const event = await service.findEventById(TEST_CREATED_EVENT_ID);

    const updateEventDto = {
      latitude: 50,
      longitude: 50,
    } as UpdateEventDto;

    expect(
      async () =>
        await service.update(
          updateEventDto,
          TEST_CREATED_EVENT_ID,
          CREATED_USER_2
        )
    ).rejects.toThrow(ForbiddenException);
  });

  it('can collaborate on events and update', async () => {
    const event = await service.findEventById(TEST_CREATED_EVENT_ID);
    await service.organizationCollaboratesOnEvent(
      TEST_CREATED_EVENT_ID,
      CREATED_ORGANIZATION_2
    );

    const updateEventDto = {
      name: 'Another Update to the name',
    } as UpdateEventDto;

    await service.update(
      updateEventDto,
      TEST_CREATED_EVENT_ID,
      CREATED_ORGANIZATION_2
    );

    const updatedEvent = await service.findEventById(TEST_CREATED_EVENT_ID);
    expect(event.name === updatedEvent.name).toBe(false);
  });

  it('can attend events', async () => {
    const event = await service.findEventById(TEST_CREATED_EVENT_ID);
    await service.userAttendsEvent(TEST_CREATED_EVENT_ID, CREATED_USER_2);
    expect(
      (await service.getEventAttendees(TEST_CREATED_EVENT_ID)).length > 0
    ).toBe(true);
  });

  it('unauthorized user cannot delete events', async () => {
    expect(
      async () =>
        await service.deleteEventById(TEST_CREATED_EVENT_ID, CREATED_USER_2)
    ).rejects.toThrow(ForbiddenException);
  });

  it('authorized user can delete events', async () => {
    await service.deleteEventById(TEST_CREATED_EVENT_ID, CREATED_USER);

    expect(
      async () => await service.findEventById(TEST_CREATED_EVENT_ID)
    ).rejects.toThrow(NotFoundException);
  });

  beforeAll(async () => {
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

    const fakeAuthHelper: Partial<AuthHelper> = {
      encodePassword: (password: string) => {
        const salt: string = bcrypt.genSaltSync(10);

        return bcrypt.hashSync(password, salt);
      },

      isPasswordValid: (password: string, userPassword: string) => {
        return password === TEST_PASSWORD;
      },
    };
    const fakeMailService: Partial<MailService> = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: UserService,
          useValue: fakeUsersService,
        },
        {
          provide: MailService,
          useValue: fakeMailService,
        },
        {
          provide: AuthHelper,
          useValue: fakeAuthHelper,
        },
        AuthService,
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
        TypeOrmModule.forFeature([Event, User]),
        EventModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: `.env.${process.env.NODE_ENV}`,
        }),
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    authService = module.get(AuthService);

    await authService.register(
      TEST_USER_CONSUMER.email,
      TEST_USER_CONSUMER.password,
      TEST_USER_CONSUMER.username,
      TEST_USER_CONSUMER.firstName,
      TEST_USER_CONSUMER.lastName,
      'consumer'
    );

    await authService.register(
      TEST_USER_ORGANIZATION.email,
      TEST_USER_ORGANIZATION.password,
      TEST_USER_ORGANIZATION.username,
      TEST_USER_ORGANIZATION.firstName,
      TEST_USER_ORGANIZATION.lastName,
      'organization'
    );

    await authService.register(
      TEST_USER_ORGANIZATION_2.email,
      TEST_USER_ORGANIZATION.password,
      TEST_USER_ORGANIZATION_2.username,
      TEST_USER_ORGANIZATION.firstName,
      TEST_USER_ORGANIZATION.lastName,
      'organization'
    );

    TESTED_CONSUMER_USER_ID = (
      await authService.findByEmail(TEST_USER_CONSUMER.email)
    ).id;

    TESTED_CONSUMER_LOGIN_JWT = await authService.login(
      TEST_USER_LOGIN_CONSUMER
    );
    TESTED_ORGANIZATION_LOGIN_JWT = await authService.login(
      TEST_USER_LOGIN_ORGANIZATION
    );

    TESTED_ORGANIZATION_2_LOGIN_JWT = await authService.login(
      TEST_USER_LOGIN_ORGANIZATION_2
    );
    CREATED_USER = await authService.findByEmail(TEST_USER_ORGANIZATION.email);
    CREATED_USER_2 = await authService.findByEmail(TEST_USER_CONSUMER.email);
    CREATED_ORGANIZATION_2 = await authService.findByEmail(
      TEST_USER_ORGANIZATION_2.email
    );
  });

  afterAll(async () => {
    authService.deleteByEmail(TEST_USER_ORGANIZATION.email);
    authService.deleteByEmail(TEST_USER_CONSUMER.email);
    authService.deleteByEmail(TEST_USER_ORGANIZATION_2.email);
  });
});
