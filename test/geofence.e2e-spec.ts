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
import { GeofenceService } from '../src/geofence/geofence.service';
import { response } from 'express';

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

const TEST_USER_LOGIN_CONSUMER = {
  email: 'tb1919@gmail.com',
  password: 'password',
};

const TEST_USER_LOGIN_ORGANIZATION = {
  email: 'tb1921@gmail.com',
  password: 'password1',
};

const TEST_GEOFENCE = {
  name: 'TEST GEOFENCE NAME',
  latLngs: [
    {
      lat: 33.722666342939284,
      lng: 73.04417809086084,
    },
    {
      lat: 33.71074366065925,
      lng: 73.05284699039697,
    },
    {
      lat: 33.71873989390002,
      lng: 73.0695839746499,
    },
    {
      lat: 33.73087561056468,
      lng: 73.06134422855615,
    },
  ],
} as CreateGeofenceDto;

const TEST_UPDATED_GEOFENCE = {
  name: 'UPDATED TEST GEOFENCE NAME',
  latLngs: [
    {
      lat: 50,
      lng: 73.04417809086084,
    },
    {
      lat: 33.71074366065925,
      lng: 73.05284699039697,
    },
    {
      lat: 33.71873989390002,
      lng: 73.0695839746499,
    },
    {
      lat: 33.73087561056468,
      lng: 73.06134422855615,
    },
  ],
} as CreateGeofenceDto;

let TESTED_CONSUMER_LOGIN_JWT = '';
let TESTED_ORGANIZATION_LOGIN_JWT = '';
let TESTED_CONSUMER_USER_ID = 0;

const TEST_PASSWORD = 'password';

describe('Geofence Controller (e2e)', () => {
  let authService: AuthService;
  let geofenceService: GeofenceService;

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
        TypeOrmModule.forFeature([User, Geofence]),
      ],

      providers: [
        AuthService,
        GeofenceService,
        {
          provide: AuthHelper,
          useValue: fakeAuthHelper,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authService = app.get(AuthService);
    geofenceService = app.get(GeofenceService);

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

    TESTED_CONSUMER_USER_ID = (
      await authService.findByEmail(TEST_USER_CONSUMER.email)
    ).id;

    TESTED_CONSUMER_LOGIN_JWT = await authService.login(
      TEST_USER_LOGIN_CONSUMER
    );
  });

  afterAll(async () => {
    authService.deleteByEmail(TEST_USER_ORGANIZATION.email);
    authService.deleteByEmail(TEST_USER_CONSUMER.email);
  });

  it('consumer can create a geofence', () => {
    return request(app.getHttpServer())
      .post('/geofences')
      .send(TEST_GEOFENCE)
      .set('Authorization', `Bearer ${TESTED_CONSUMER_LOGIN_JWT}`)
      .expect(201);
  });

  it('organization cannot create a geofence', () => {
    return request(app.getHttpServer())
      .post('/geofences')
      .send(TEST_GEOFENCE)
      .set('Authorization', `Bearer ${TESTED_ORGANIZATION_LOGIN_JWT}`)
      .expect(403);
  });

  it('consumer can edit their geofence', async () => {
    let geofenceId = await geofenceService.findAllGeofencesByUserId(
      TESTED_CONSUMER_USER_ID
    );
    let id = geofenceId.pop().id;
    return request(app.getHttpServer())
      .put(`/geofences/${id}`)
      .send(TEST_UPDATED_GEOFENCE)
      .set('Authorization', `Bearer ${TESTED_CONSUMER_LOGIN_JWT}`)
      .expect(200);
  });

  it('consumer can get geofence by Id', async () => {
    let geofenceId = await geofenceService.findAllGeofencesByUserId(
      TESTED_CONSUMER_USER_ID
    );
    return request(app.getHttpServer())
      .get(`/geofences/${geofenceId.pop().id}`)
      .set('Authorization', `Bearer ${TESTED_CONSUMER_LOGIN_JWT}`)
      .expect(200);
  });

  it('consumer can get list of their geofences', async () => {
    return request(app.getHttpServer())
      .get(`/geofences/users/${TESTED_CONSUMER_USER_ID}`)
      .set('Authorization', `Bearer ${TESTED_CONSUMER_LOGIN_JWT}`)
      .expect(200);
  });

  it('consumer can delete geofence by Id', async () => {
    let geofenceId = await geofenceService.findAllGeofencesByUserId(
      TESTED_CONSUMER_USER_ID
    );
    return request(app.getHttpServer())
      .delete(`/geofences/${geofenceId.pop().id}`)
      .set('Authorization', `Bearer ${TESTED_CONSUMER_LOGIN_JWT}`)
      .expect(200);
  });
});
