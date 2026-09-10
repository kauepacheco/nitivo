import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { startTestDatabase, TestDatabase } from './support/test-database';

describe('Acesso da equipe (e2e)', () => {
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

  it('proprietário convida uma nova pessoa, que define sua senha e entra como funcionário', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });

    const invitation = await owner.agent
      .post('/api/car-washes/lavacao-sol/team/invitations')
      .set('x-csrf-token', owner.csrfToken)
      .send({ email: 'funcionaria.sol@example.test' })
      .expect(201);

    expect(invitation.body).toEqual({
      email: 'funcionaria.sol@example.test',
      expiresAt: expect.any(String),
      invitationUrl: expect.stringMatching(
        /^http:\/\/127\.0\.0\.1:3000\/accept-invitation\?token=[A-Za-z0-9_-]+$/,
      ),
    });
    const token = new URL(
      invitation.body.invitationUrl as string,
    ).searchParams.get('token');

    await request(app.getHttpServer())
      .get(`/api/team/invitations/${token}`)
      .expect(200)
      .expect({
        carWashName: 'Lavação Sol',
        email: 'funcionaria.sol@example.test',
        existingAccount: false,
      });

    await request(app.getHttpServer())
      .post(`/api/team/invitations/${token}/accept-new`)
      .send({ password: 'Senha-ficticia-123!' })
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/team/invitations/${token}/accept-new`)
      .send({ password: 'Outra-senha-ficticia-123!' })
      .expect(400);

    const employee = request.agent(app.getHttpServer());
    const login = await employee
      .post('/api/auth/login')
      .send({
        email: 'funcionaria.sol@example.test',
        password: 'Senha-ficticia-123!',
      })
      .expect(200);

    expect(login.body.user.memberships).toEqual([
      {
        carWashId: 'lavacao-sol',
        carWashName: 'Lavação Sol',
        role: 'EMPLOYEE',
      },
    ]);
    await employee
      .post('/api/car-washes/lavacao-sol/services')
      .set('x-csrf-token', login.body.csrfToken as string)
      .send({
        name: 'Serviço indevido',
        priceInCents: 100,
        durationInMinutes: 15,
        active: true,
      })
      .expect(404);
  });

  it('conta existente aceita novo vínculo autenticada sem redefinir a senha', async () => {
    const firstOwner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.comum@example.test',
    });
    const secondOwner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dono.lua@example.test',
    });

    const invitation = await secondOwner.agent
      .post('/api/car-washes/lavacao-lua/team/invitations')
      .set('x-csrf-token', secondOwner.csrfToken)
      .send({ email: 'dona.comum@example.test' })
      .expect(201);
    const token = new URL(
      invitation.body.invitationUrl as string,
    ).searchParams.get('token');

    await request(app.getHttpServer())
      .post(`/api/team/invitations/${token}/accept-new`)
      .send({ password: 'Senha-substituta-123!' })
      .expect(409);

    await firstOwner.agent
      .post(`/api/team/invitations/${token}/accept-existing`)
      .set('x-csrf-token', firstOwner.csrfToken)
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'dona.comum@example.test',
        password: 'Senha-ficticia-123!',
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'dona.comum@example.test',
        password: 'Senha-substituta-123!',
      })
      .expect(401);

    const session = await firstOwner.agent.get('/api/auth/session').expect(200);
    expect(session.body.user.memberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ carWashId: 'lavacao-sol', role: 'OWNER' }),
        expect.objectContaining({ carWashId: 'lavacao-lua', role: 'EMPLOYEE' }),
      ]),
    );

    await firstOwner.agent
      .post('/api/car-washes/lavacao-sol/services')
      .set('x-csrf-token', firstOwner.csrfToken)
      .send({
        name: 'Lavagem preservada',
        priceInCents: 5000,
        durationInMinutes: 60,
        active: true,
      })
      .expect(201);
    await firstOwner.agent
      .post('/api/car-washes/lavacao-lua/services')
      .set('x-csrf-token', firstOwner.csrfToken)
      .send({
        name: 'Alteração indevida',
        priceInCents: 5000,
        durationInMinutes: 60,
        active: true,
      })
      .expect(404);
  });

  it('revoga o vínculo na próxima operação sem afetar outra lavação', async () => {
    const ownerA = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    const ownerB = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dona.lua@example.test',
    });
    const employee = await createEmployeeWithTwoMemberships(database, app);

    const team = await ownerA.agent
      .get('/api/car-washes/lavacao-sol/team')
      .expect(200);
    const membership = team.body.members.find(
      (member: { email: string }) =>
        member.email === 'funcionaria.comum@example.test',
    );

    await ownerB.agent
      .delete(`/api/car-washes/lavacao-lua/team/members/${membership.id}`)
      .set('x-csrf-token', ownerB.csrfToken)
      .expect(404);
    await ownerA.agent
      .delete(`/api/car-washes/lavacao-sol/team/members/${membership.id}`)
      .set('x-csrf-token', ownerA.csrfToken)
      .expect(204);

    const session = await employee.agent.get('/api/auth/session').expect(200);
    expect(session.body.user.memberships).toEqual([
      expect.objectContaining({ carWashId: 'lavacao-lua', role: 'EMPLOYEE' }),
    ]);
    await employee.agent
      .get('/api/car-washes/lavacao-sol/services')
      .expect(404);
    await employee.agent
      .get('/api/car-washes/lavacao-lua/services')
      .expect(404);
    await employee.agent.get('/api/car-washes/lavacao-lua/team').expect(404);
  });

  it('rejeita convite expirado e limita tentativas com links inválidos', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol-sol',
      email: 'dona.expiracao@example.test',
    });
    const invitation = await owner.agent
      .post('/api/car-washes/lavacao-sol-sol/team/invitations')
      .set('x-csrf-token', owner.csrfToken)
      .send({ email: 'funcionaria.expirada@example.test' })
      .expect(201);
    const token = new URL(
      invitation.body.invitationUrl as string,
    ).searchParams.get('token');
    await expireInvitations(database);
    await request(app.getHttpServer())
      .get(`/api/team/invitations/${token}`)
      .set('x-forwarded-for', '192.0.2.10')
      .expect(400);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await request(app.getHttpServer())
        .get(`/api/team/invitations/token-invalido-${attempt}`)
        .set('x-forwarded-for', '192.0.2.10')
        .expect(400);
    }
    await request(app.getHttpServer())
      .get('/api/team/invitations/token-invalido-final')
      .set('x-forwarded-for', '192.0.2.10')
      .expect(429);
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });
});

async function authenticatedOwner(
  database: TestDatabase,
  app: INestApplication<App>,
  input: { carWashId: string; email: string },
) {
  const token = `token-${input.carWashId}-${input.email}`;
  await seedOwner(database, { ...input, token });
  await request(app.getHttpServer())
    .post('/api/auth/set-password')
    .send({ token, password: 'Senha-ficticia-123!' })
    .expect(204);
  const agent = request.agent(app.getHttpServer());
  const login = await agent
    .post('/api/auth/login')
    .send({ email: input.email, password: 'Senha-ficticia-123!' })
    .expect(200);
  return { agent, csrfToken: login.body.csrfToken as string };
}

async function seedOwner(
  database: TestDatabase,
  input: { carWashId: string; email: string; token: string },
) {
  const client = database.client();
  await client.connect();
  try {
    const userId = `${input.carWashId}-owner`;
    await client.query(
      'INSERT INTO "CarWash" (id, name, slug) VALUES ($1, $2, $3)',
      [
        input.carWashId,
        input.carWashId === 'lavacao-sol' ? 'Lavação Sol' : 'Lavação Lua',
        input.carWashId,
      ],
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
        createHash('sha256').update(input.token).digest('hex'),
        new Date(Date.now() + 3_600_000),
      ],
    );
  } finally {
    await client.end();
  }
}

async function createEmployeeWithTwoMemberships(
  database: TestDatabase,
  app: INestApplication<App>,
) {
  const token = 'token-ficticio-funcionaria-comum';
  const client = database.client();
  await client.connect();
  try {
    await client.query('INSERT INTO "User" (id, email) VALUES ($1, $2)', [
      'funcionaria-comum',
      'funcionaria.comum@example.test',
    ]);
    for (const carWashId of ['lavacao-sol', 'lavacao-lua']) {
      await client.query(
        'INSERT INTO "Membership" (id, "userId", "carWashId", role, status) VALUES ($1, $2, $3, $4, $5)',
        [
          `funcionaria-${carWashId}`,
          'funcionaria-comum',
          carWashId,
          'EMPLOYEE',
          'ACTIVE',
        ],
      );
    }
    await client.query(
      'INSERT INTO "AccessToken" (id, "userId", purpose, "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4, $5)',
      [
        'funcionaria-token',
        'funcionaria-comum',
        'SET_PASSWORD',
        createHash('sha256').update(token).digest('hex'),
        new Date(Date.now() + 3_600_000),
      ],
    );
  } finally {
    await client.end();
  }
  await request(app.getHttpServer())
    .post('/api/auth/set-password')
    .send({ token, password: 'Senha-ficticia-123!' })
    .expect(204);
  const agent = request.agent(app.getHttpServer());
  const login = await agent
    .post('/api/auth/login')
    .send({
      email: 'funcionaria.comum@example.test',
      password: 'Senha-ficticia-123!',
    })
    .expect(200);
  return { agent, csrfToken: login.body.csrfToken as string };
}

async function expireInvitations(database: TestDatabase) {
  const client = database.client();
  await client.connect();
  try {
    await client.query(
      'UPDATE "EmployeeInvitation" SET "expiresAt" = NOW() - INTERVAL \'1 minute\'',
    );
  } finally {
    await client.end();
  }
}
