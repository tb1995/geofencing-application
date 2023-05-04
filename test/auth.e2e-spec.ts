import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

const TEST_USER = {
  email: 'tb1919@gmail.com',
  username: 'talha94',
  password: 'password',
  lol: 'lol',
  firstName: 'Talha',
  lastName: 'Hasan',
  role: 'consumer',
};

const TEST_USER_LOGIN = {
  email: 'tb1919@gmail.com',
  password: 'password',
};

const TEST_USER_LOGIN_INCORRECT = {
  email: 'tb1919@gmail.com',
  password: 'password1',
};

let TESTED_USER_LOGIN_JWT = '';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('handles a sign up request', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send(TEST_USER)
      .expect(200);
  });

  it('returns a 409 conflict if a user with a duplicate email was added', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send(TEST_USER)
      .expect(409);
  });

  it('created user can login', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(TEST_USER_LOGIN)
      .expect(201)
      .then((jwt) => {
        TESTED_USER_LOGIN_JWT = jwt.text;
      });
  });

  it('login user with invalid password returns unauthorized', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(TEST_USER_LOGIN_INCORRECT)
      .expect(401);
  });

  it('delete user with email address returns unauthorized', () => {
    return request(app.getHttpServer())
      .delete('/users')
      .send(TEST_USER_LOGIN)
      .set('authorization', `Bearer ${TESTED_USER_LOGIN_JWT}`)
      .expect(200);
  });

  it('deleted user cannot login', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(TEST_USER_LOGIN)
      .expect(404);
  });
});
