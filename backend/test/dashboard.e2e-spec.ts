import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { startTestDatabase, TestDatabase } from './support/test-database';

describe('Painel do proprietário (e2e)', () => {
  let app: INestApplication<App>;
  let database: TestDatabase;

  beforeAll(async () => {
    database = await startTestDatabase();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  }, 120_000);

  beforeEach(async () => database.reset());
  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });

  it('calcula indicadores pela data prevista local, estado atual e preço histórico', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    await seedIndicatorAppointments(database, 'lavacao-sol');

    await owner
      .get('/api/car-washes/lavacao-sol/dashboard')
      .query({ from: '2026-09-10', to: '2026-09-11' })
      .expect(200)
      .expect({
        period: {
          from: '2026-09-10',
          to: '2026-09-11',
          timezone: 'America/Sao_Paulo',
        },
        criteria: {
          date: 'Data prevista do atendimento no fuso da lavação',
          status: 'Estado atual do agendamento',
          value: 'Preços históricos dos serviços concluídos',
        },
        completed: 2,
        canceled: 1,
        noShow: 1,
        completedServicesValueInCents: 12_500,
      });
  });

  it('restringe indicadores ao proprietário da própria lavação', async () => {
    const ownerA = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    const ownerB = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dona.lua@example.test',
    });
    await seedIndicatorAppointments(database, 'lavacao-sol');
    const path = '/api/car-washes/lavacao-sol/dashboard';

    await request(app.getHttpServer()).get(path).expect(401);
    await ownerB.get(path).expect(404);
    await ownerB
      .get('/api/car-washes/lavacao-lua/dashboard')
      .query({ from: '2026-09-10', to: '2026-09-11' })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          completed: 0,
          canceled: 0,
          noShow: 0,
          completedServicesValueInCents: 0,
        });
      });

    await changeMembershipRole(database, 'lavacao-sol', 'EMPLOYEE');
    await ownerA.get(path).expect(404);
  });

  it('rejeita datas inexistentes e períodos invertidos', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    const path = '/api/car-washes/lavacao-sol/dashboard';

    await owner
      .get(path)
      .query({ from: '2026-02-30', to: '2026-03-01' })
      .expect(400);
    await owner
      .get(path)
      .query({ from: '2026-09-11', to: '2026-09-10' })
      .expect(400);
  });

  it('documenta o período e os indicadores no OpenAPI', async () => {
    const openApi = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const operation =
      openApi.body.paths['/api/car-washes/{carWashId}/dashboard'].get;

    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'from', in: 'query', required: false }),
        expect.objectContaining({ name: 'to', in: 'query', required: false }),
      ]),
    );
    expect(operation.responses[200].content['application/json'].schema).toEqual(
      { $ref: '#/components/schemas/DashboardDto' },
    );
    expect(openApi.body.components.schemas.DashboardDto.required).toEqual(
      expect.arrayContaining([
        'period',
        'criteria',
        'completed',
        'canceled',
        'noShow',
        'completedServicesValueInCents',
      ]),
    );
  });
});

async function authenticatedOwner(
  database: TestDatabase,
  app: INestApplication<App>,
  input: { carWashId: string; email: string },
) {
  const setupToken = `token-ficticio-${input.carWashId}`;
  const userId = `${input.carWashId}-owner`;
  const client = database.client();
  await client.connect();
  try {
    await client.query(
      'INSERT INTO "CarWash" (id, name, slug) VALUES ($1, $2, $3)',
      [input.carWashId, 'Lavação Sol', input.carWashId],
    );
    await client.query('INSERT INTO "User" (id, email) VALUES ($1, $2)', [
      userId,
      input.email,
    ]);
    await client.query(
      'INSERT INTO "Membership" (id, "userId", "carWashId", role, status) VALUES ($1, $2, $3, $4, $5)',
      [`${userId}-membership`, userId, input.carWashId, 'OWNER', 'ACTIVE'],
    );
    await client.query(
      'INSERT INTO "AccessToken" (id, "userId", purpose, "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4, $5)',
      [
        `${userId}-token`,
        userId,
        'SET_PASSWORD',
        createHash('sha256').update(setupToken).digest('hex'),
        new Date(Date.now() + 3_600_000),
      ],
    );
  } finally {
    await client.end();
  }
  await request(app.getHttpServer())
    .post('/api/auth/set-password')
    .send({ token: setupToken, password: 'Senha-ficticia-123!' })
    .expect(204);
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/auth/login').send({
    email: input.email,
    password: 'Senha-ficticia-123!',
  });
  return agent;
}

async function seedIndicatorAppointments(
  database: TestDatabase,
  carWashId: string,
) {
  const client = database.client();
  await client.connect();
  try {
    await client.query(
      'INSERT INTO "ServiceOffering" (id, "carWashId", name, "priceInCents", "durationInMinutes") VALUES ($1, $2, $3, $4, $5)',
      ['servico-painel', carWashId, 'Lavagem completa', 99_00, 60],
    );
    await client.query(
      'INSERT INTO "Box" (id, "carWashId", name) VALUES ($1, $2, $3)',
      ['box-painel', carWashId, 'Box principal'],
    );
    const fixtures = [
      ['fora-inicio', '2026-09-10T02:59:00.000Z', 'COMPLETED', 10_000],
      ['concluido-um', '2026-09-10T03:00:00.000Z', 'COMPLETED', 7_500],
      ['cancelado', '2026-09-10T15:00:00.000Z', 'CANCELED', 8_000],
      ['falta', '2026-09-11T18:00:00.000Z', 'NO_SHOW', 9_000],
      ['confirmado', '2026-09-11T19:00:00.000Z', 'CONFIRMED', 6_000],
      ['concluido-dois', '2026-09-12T02:59:00.000Z', 'COMPLETED', 5_000],
      ['fora-fim', '2026-09-12T03:00:00.000Z', 'COMPLETED', 20_000],
    ] as const;
    for (const [id, startsAt, status, price] of fixtures) {
      await client.query(
        `INSERT INTO "Appointment" (id, "carWashId", "boxId", "serviceOfferingId", "startsAt", "endsAt", "serviceName", "servicePriceInCents", "serviceDurationInMinutes", status)
         VALUES ($1, $2, $3, $4, $5, $5::timestamptz + interval '1 hour', $6, $7, $8, $9)`,
        [
          id,
          carWashId,
          'box-painel',
          'servico-painel',
          startsAt,
          'Lavagem histórica',
          price,
          60,
          status,
        ],
      );
    }
  } finally {
    await client.end();
  }
}

async function changeMembershipRole(
  database: TestDatabase,
  carWashId: string,
  role: 'OWNER' | 'EMPLOYEE',
) {
  const client = database.client();
  await client.connect();
  try {
    await client.query(
      'UPDATE "Membership" SET role = $1 WHERE "carWashId" = $2',
      [role, carWashId],
    );
  } finally {
    await client.end();
  }
}
