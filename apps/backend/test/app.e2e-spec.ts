import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('/v1/dashboard/metrics (GET) should fail without auth', () => {
    return request(app.getHttpServer())
      .get('/v1/dashboard/metrics')
      .expect(401);
  });

  it('/v1/estaciones (GET) should fail without auth', () => {
    return request(app.getHttpServer())
      .get('/v1/estaciones')
      .expect(401);
  });

  it('/v1/auth/me (GET) should fail without auth', () => {
    return request(app.getHttpServer())
      .get('/v1/auth/me')
      .expect(401);
  });

  it('/v1/auth/register (POST) should fail with validation error on empty body', () => {
    return request(app.getHttpServer())
      .get('/v1/auth/register')
      .expect(404);
  });

  it('/v1/auth/register (POST) validation bad request', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({})
      .expect(400);
  });

  it('/v1/auth/login (POST) validation bad request', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({})
      .expect(400);
  });
});
