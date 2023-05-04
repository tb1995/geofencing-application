import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/user/auth/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import entities, { Geofence, User } from '../src/typeorm';
import { AuthHelper } from '../src/user/auth/auth.helper';
import * as bcrypt from 'bcryptjs';
import { CreateGeofenceDto } from '../src/geofence/dtos/create-geofence.dto';
import { response } from 'express';
import { EventService } from '../src/event/event.service';
import { CreateEventDto } from '../src/event/dtos/create-event.dto';
import { UpdateEventDto } from '../src/event/dtos/update-event.dto';
import { MailService } from '../src/mail/mail.service';
import { UserService } from '../src/user/user.service';

const TEST_USER_CONSUMER = {
  email: 'tb1919@gmail.com',
  username: 'talha94',
  password: 'password',
  lol: 'lol',
  firstName: 'Talha',
  lastName: 'Hasan',
  role: 'consumer',
};

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

let TEST_CREATED_EVENT_ID = '';

describe('Event Controller (e2e)', () => {
  let authService: AuthService;
  let eventService: EventService;

  let app: INestApplication;

  beforeAll(async () => {
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
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
        TypeOrmModule.forFeature([User, Event]),
      ],

      providers: [
        AuthService,
        EventService,
        UserService,
        {
          provide: AuthHelper,
          useValue: fakeAuthHelper,
        },
        {
          provide: MailService,
          useValue: fakeMailService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authService = app.get(AuthService);
    eventService = app.get(EventService);

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
  });

  afterAll(async () => {
    authService.deleteByEmail(TEST_USER_ORGANIZATION.email);
    authService.deleteByEmail(TEST_USER_CONSUMER.email);
    authService.deleteByEmail(TEST_USER_ORGANIZATION_2.email);
  });

  it('organization can create an event', () => {
    return request(app.getHttpServer())
      .post('/events')
      .send(TEST_EVENT)
      .set('Authorization', `Bearer ${TESTED_ORGANIZATION_LOGIN_JWT}`)
      .expect(201)
      .expect((response) => {
        TEST_CREATED_EVENT_ID = response.text;
      });
  });

  it('consumer cannot create an event', () => {
    return request(app.getHttpServer())
      .post('/events')
      .send(TEST_EVENT)
      .set('Authorization', `Bearer ${TESTED_CONSUMER_LOGIN_JWT}`)
      .expect(403);
  });

  it('organization can edit their event', async () => {
    return request(app.getHttpServer())
      .put(`/events/${TEST_CREATED_EVENT_ID}`)
      .send(TEST_UPDATED_EVENT)
      .set('Authorization', `Bearer ${TESTED_ORGANIZATION_LOGIN_JWT}`)
      .expect(200);
  });

  it('can get event by id', async () => {
    return request(app.getHttpServer())
      .get(`/events/${TEST_CREATED_EVENT_ID}`)
      .set('Authorization', `Bearer ${TESTED_ORGANIZATION_LOGIN_JWT}`)
      .expect(200);
  });

  it('consumer can attend event', async () => {
    let user = await authService.findByEmail(TEST_USER_CONSUMER.email);
    return request(app.getHttpServer())
      .post(`/events/${TEST_CREATED_EVENT_ID}/attend`)
      .send(user)
      .set('Authorization', `Bearer ${TESTED_CONSUMER_LOGIN_JWT}`)
      .expect(201);
  });

  it('organization 2 can collaborate on event', async () => {
    let user = await authService.findByEmail(TEST_USER_ORGANIZATION_2.email);
    return request(app.getHttpServer())
      .post(`/events/${TEST_CREATED_EVENT_ID}/collaborate`)
      .send(user)
      .set('Authorization', `Bearer ${TESTED_ORGANIZATION_2_LOGIN_JWT}`)
      .expect(201);
  });

  it('can get event attendees', async () => {
    return request(app.getHttpServer())
      .get(`/events/${TEST_CREATED_EVENT_ID}/attendees`)
      .expect(200);
  });

  it('can get event collaborators', async () => {
    return request(app.getHttpServer())
      .get(`/events/${TEST_CREATED_EVENT_ID}/collaborators`)
      .expect(200);
  });

  it('organizer can delete event', async () => {
    return request(app.getHttpServer())
      .delete(`/events/${TEST_CREATED_EVENT_ID}`)
      .set('Authorization', `Bearer ${TESTED_ORGANIZATION_LOGIN_JWT}`)
      .expect(200);
  });
});
