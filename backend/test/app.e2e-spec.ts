import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { startTestDatabase, TestDatabase } from './support/test-database';

describe('Nitivo API (e2e)', () => {
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

  beforeEach(async () => {
    await database.reset();
  });

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('permite que o proprietário defina a senha e entre por um link de uso único', async () => {
    const setupToken = 'token-ficticio-do-proprietario';
    await seedOwner(database, {
      carWashId: 'lavacao-sol',
      email: 'proprietario.sol@example.test',
      setupToken,
    });

    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({ token: setupToken, password: 'Senha-ficticia-123!' })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({ token: setupToken, password: 'Outra-senha-ficticia-123!' })
      .expect(400);

    const agent = request.agent(app.getHttpServer());
    const login = await agent
      .post('/api/auth/login')
      .send({
        email: 'proprietario.sol@example.test',
        password: 'Senha-ficticia-123!',
      })
      .expect(200);

    expect(login.body).toEqual({
      csrfToken: expect.any(String),
      user: {
        email: 'proprietario.sol@example.test',
        memberships: [
          {
            carWashId: 'lavacao-sol',
            carWashName: 'Lavação Sol',
            role: 'OWNER',
          },
        ],
      },
    });
  });

  it('provisiona a lavação e entrega ao operador um link temporário sem criar cadastro público', async () => {
    const outputFile = join(tmpdir(), `nitivo-link-${randomUUID()}.txt`);
    const output = execFileSync(
      process.execPath,
      [
        '--require',
        'ts-node/register',
        'src/scripts/provision-owner.ts',
        '--car-wash-name',
        'Lavação Horizonte',
        '--slug',
        'lavacao-horizonte',
        '--owner-email',
        'dona.horizonte@example.test',
        '--output-file',
        outputFile,
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, APP_URL: 'http://127.0.0.1:3000' },
        encoding: 'utf8',
      },
    );
    expect(output).toBe('Link privado gravado no arquivo indicado.\n');
    const link = readFileSync(outputFile, 'utf8').trim();
    unlinkSync(outputFile);
    expect(link).toMatch(
      /^http:\/\/127\.0\.0\.1:3000\/set-password\?token=[A-Za-z0-9_-]+$/,
    );

    const token = new URL(link).searchParams.get('token');
    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({ token, password: 'Senha-ficticia-123!' })
      .expect(204);
  });

  it('não provisiona a lavação quando o arquivo privado de saída já existe', async () => {
    const outputFile = join(tmpdir(), `nitivo-link-${randomUUID()}.txt`);
    writeFileSync(outputFile, 'não sobrescrever\n', { mode: 0o600 });

    expect(() =>
      execFileSync(
        process.execPath,
        [
          '--require',
          'ts-node/register',
          'src/scripts/provision-owner.ts',
          '--car-wash-name',
          'Lavação Arquivo Existente',
          '--slug',
          'lavacao-arquivo-existente',
          '--owner-email',
          'dona.arquivo@example.test',
          '--output-file',
          outputFile,
        ],
        {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
          stdio: 'pipe',
        },
      ),
    ).toThrow();

    expect(readFileSync(outputFile, 'utf8')).toBe('não sobrescrever\n');
    unlinkSync(outputFile);
    expect(await countCarWashes(database, 'lavacao-arquivo-existente')).toBe(0);
  });

  it('persiste serviços válidos e isola o catálogo entre lavações', async () => {
    const ownerA = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    const ownerB = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dono.lua@example.test',
    });

    const created = await ownerA.agent
      .post('/api/car-washes/lavacao-sol/services')
      .set('x-csrf-token', ownerA.csrfToken)
      .send({
        name: 'Lavagem completa',
        priceInCents: 7500,
        durationInMinutes: 90,
        active: true,
      })
      .expect(201);

    expect(created.body).toEqual({
      id: expect.any(String),
      name: 'Lavagem completa',
      priceInCents: 7500,
      durationInMinutes: 90,
      active: true,
    });

    await ownerA.agent
      .get('/api/car-washes/lavacao-sol/services')
      .expect(200)
      .expect([created.body]);

    await ownerB.agent.get('/api/car-washes/lavacao-sol/services').expect(404);

    await ownerB.agent
      .post('/api/car-washes/lavacao-sol/services')
      .set('x-csrf-token', ownerB.csrfToken)
      .send({
        name: 'Serviço invasor',
        priceInCents: 1,
        durationInMinutes: 1,
        active: true,
      })
      .expect(404);

    await ownerA.agent
      .get('/api/car-washes/lavacao-sol/services')
      .expect(200)
      .expect([created.body]);
  });

  it('não autoriza funcionário a administrar o catálogo', async () => {
    const employee = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'funcionario.sol@example.test',
    });
    const client = database.client();
    await client.connect();
    await client.query(
      'UPDATE "Membership" SET role = \'EMPLOYEE\' WHERE "carWashId" = $1',
      ['lavacao-sol'],
    );
    await client.end();

    await employee.agent
      .post('/api/car-washes/lavacao-sol/services')
      .set('x-csrf-token', employee.csrfToken)
      .send({
        name: 'Lavagem',
        priceInCents: 5000,
        durationInMinutes: 60,
        active: true,
      })
      .expect(404);
  });

  it('rejeita serviço sem nome útil, preço inteiro ou duração positiva', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });

    for (const invalidService of [
      {
        name: '   ',
        priceInCents: 7500,
        durationInMinutes: 90,
        active: true,
      },
      {
        name: 'Lavagem',
        priceInCents: 75.5,
        durationInMinutes: 90,
        active: true,
      },
      {
        name: 'Lavagem',
        priceInCents: 7500,
        durationInMinutes: 0,
        active: true,
      },
    ]) {
      await owner.agent
        .post('/api/car-washes/lavacao-sol/services')
        .set('x-csrf-token', owner.csrfToken)
        .send(invalidService)
        .expect(400);
    }

    await owner.agent
      .get('/api/car-washes/lavacao-sol/services')
      .expect(200)
      .expect([]);
  });

  it('exige CSRF e revoga a sessão no logout', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });

    await owner.agent
      .post('/api/car-washes/lavacao-sol/services')
      .send({
        name: 'Lavagem',
        priceInCents: 5000,
        durationInMinutes: 60,
        active: true,
      })
      .expect(403);

    await owner.agent
      .post('/api/auth/logout')
      .set('x-csrf-token', owner.csrfToken)
      .expect(204);

    await owner.agent.get('/api/car-washes/lavacao-sol/services').expect(401);
  });

  it('limita tentativas repetidas de login sem expor se a conta existe', async () => {
    const setupToken = 'token-limite-de-login';
    await seedOwner(database, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
      setupToken,
    });
    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({ token: setupToken, password: 'Senha-ficticia-123!' })
      .expect(204);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'dona.sol@example.test',
          password: 'Senha-incorreta-123!',
        })
        .expect(401)
        .expect(({ body }) => {
          expect(body.message).toBe('E-mail ou senha inválidos');
        });
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'dona.sol@example.test',
        password: 'Senha-incorreta-123!',
      })
      .expect(429);
  });

  it('limita tentativas com links de acesso inválidos', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/set-password')
        .send({
          token: `token-invalido-ficticio-${attempt}`,
          password: 'Senha-ficticia-123!',
        })
        .expect(400);
    }

    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({
        token: 'token-invalido-ficticio-final',
        password: 'Senha-ficticia-123!',
      })
      .expect(429);
  });

  it('rejeita link de definição de senha expirado', async () => {
    await seedOwner(database, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
      setupToken: 'token-ficticio-expirado',
      expiresAt: new Date(Date.now() - 60_000),
    });

    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({
        token: 'token-ficticio-expirado',
        password: 'Senha-ficticia-123!',
      })
      .expect(400);
  });

  it('encerra sessão expirada por inatividade', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    await updateSessions(
      database,
      '"expiresAt" = NOW() - INTERVAL \'1 minute\'',
    );

    await owner.agent.get('/api/auth/session').expect(401);
  });

  it('encerra sessão ao atingir seu limite absoluto', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    await updateSessions(
      database,
      '"absoluteExpiresAt" = NOW() - INTERVAL \'1 minute\'',
    );

    await owner.agent.get('/api/auth/session').expect(401);
  });

  it('não aceita link de ativação para trocar uma senha existente', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    const newToken = 'token-ficticio-nova-senha';
    await seedAccessToken(database, 'lavacao-sol-owner', newToken);

    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({ token: newToken, password: 'Nova-senha-ficticia-123!' })
      .expect(400);

    await owner.agent.get('/api/auth/session').expect(200);
  });

  it('recupera o acesso por link privado e revoga as sessões antigas', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.recuperacao@example.test',
    });
    const outputFile = join(
      tmpdir(),
      `nitivo-recovery-link-${randomUUID()}.txt`,
    );
    const output = execFileSync(
      process.execPath,
      [
        '--require',
        'ts-node/register',
        'src/scripts/recover-access.ts',
        '--email',
        'dona.recuperacao@example.test',
        '--output-file',
        outputFile,
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, APP_URL: 'http://127.0.0.1:3000' },
        encoding: 'utf8',
      },
    );
    expect(output).toBe('Link privado gravado no arquivo indicado.\n');
    expect(statSync(outputFile).mode & 0o777).toBe(0o600);
    const recoveryLink = readFileSync(outputFile, 'utf8').trim();
    unlinkSync(outputFile);
    expect(recoveryLink).toMatch(
      /^http:\/\/127\.0\.0\.1:3000\/reset-password\?token=[A-Za-z0-9_-]+$/,
    );

    const token = new URL(recoveryLink).searchParams.get('token');
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, password: 'Nova-senha-ficticia-123!' })
      .expect(204);

    await owner.agent.get('/api/auth/session').expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'dona.recuperacao@example.test',
        password: 'Senha-ficticia-123!',
      })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'dona.recuperacao@example.test',
        password: 'Nova-senha-ficticia-123!',
      })
      .expect(200);
  });

  it('não sobrescreve arquivo existente ao criar link de recuperação', async () => {
    await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.arquivo-recuperacao@example.test',
    });
    const outputFile = join(
      tmpdir(),
      `nitivo-recovery-existing-${randomUUID()}.txt`,
    );
    writeFileSync(outputFile, 'não sobrescrever\n', { mode: 0o600 });

    expect(() =>
      execFileSync(
        process.execPath,
        [
          '--require',
          'ts-node/register',
          'src/scripts/recover-access.ts',
          '--email',
          'dona.arquivo-recuperacao@example.test',
          '--output-file',
          outputFile,
        ],
        {
          cwd: process.cwd(),
          env: { ...process.env, APP_URL: 'http://127.0.0.1:3000' },
          stdio: 'pipe',
        },
      ),
    ).toThrow();
    expect(readFileSync(outputFile, 'utf8')).toBe('não sobrescrever\n');
    unlinkSync(outputFile);
  });

  it('mantém links de ativação e recuperação com finalidades separadas', async () => {
    await seedOwner(database, {
      carWashId: 'lavacao-sol',
      email: 'dona.finalidade@example.test',
      setupToken: 'token-ficticio-de-ativacao',
    });
    await seedAccessToken(
      database,
      'lavacao-sol-owner',
      'token-ficticio-de-recuperacao',
      { purpose: 'RESET_PASSWORD' },
    );

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token: 'token-ficticio-de-ativacao',
        password: 'Nova-senha-ficticia-123!',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({
        token: 'token-ficticio-de-recuperacao',
        password: 'Nova-senha-ficticia-123!',
      })
      .expect(400);
  });

  it('rejeita link de recuperação expirado, reutilizado ou sob abuso', async () => {
    await seedOwner(database, {
      carWashId: 'lavacao-sol',
      email: 'dona.links@example.test',
      setupToken: 'token-ficticio-inicial',
    });
    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({
        token: 'token-ficticio-inicial',
        password: 'Senha-ficticia-123!',
      })
      .expect(204);
    await seedAccessToken(
      database,
      'lavacao-sol-owner',
      'token-ficticio-recuperacao-expirado',
      {
        purpose: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() - 60_000),
      },
    );
    await seedAccessToken(
      database,
      'lavacao-sol-owner',
      'token-ficticio-recuperacao-valido',
      { purpose: 'RESET_PASSWORD' },
    );

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .set('x-forwarded-for', '192.0.2.30')
      .send({
        token: 'token-ficticio-recuperacao-expirado',
        password: 'Nova-senha-ficticia-123!',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .set('x-forwarded-for', '192.0.2.31')
      .send({
        token: 'token-ficticio-recuperacao-valido',
        password: 'Nova-senha-ficticia-123!',
      })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .set('x-forwarded-for', '192.0.2.31')
      .send({
        token: 'token-ficticio-recuperacao-valido',
        password: 'Outra-senha-ficticia-123!',
      })
      .expect(400);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .set('x-forwarded-for', '192.0.2.32')
        .send({
          token: `token-recuperacao-invalido-${attempt}`,
          password: 'Nova-senha-ficticia-123!',
        })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .set('x-forwarded-for', '192.0.2.32')
      .send({
        token: 'token-recuperacao-invalido-final',
        password: 'Nova-senha-ficticia-123!',
      })
      .expect(429);
  });

  it('contabiliza tentativas concorrentes por origem atrás do proxy', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 5 }, (_, attempt) =>
        request(app.getHttpServer())
          .post('/api/auth/reset-password')
          .set('x-forwarded-for', '192.0.2.40')
          .send({
            token: `token-concorrente-invalido-${attempt}`,
            password: 'Nova-senha-ficticia-123!',
          }),
      ),
    );
    expect(attempts.map((response) => response.status)).toEqual([
      400, 400, 400, 400, 400,
    ]);

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .set('x-forwarded-for', '192.0.2.40')
      .send({
        token: 'token-concorrente-bloqueado',
        password: 'Nova-senha-ficticia-123!',
      })
      .expect(429);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .set('x-forwarded-for', '192.0.2.41')
      .send({
        token: 'token-de-outra-origem',
        password: 'Nova-senha-ficticia-123!',
      })
      .expect(400);
  });

  it('consome o link de recuperação atomicamente', async () => {
    await seedOwner(database, {
      carWashId: 'lavacao-sol',
      email: 'dona.concorrencia@example.test',
      setupToken: 'token-ficticio-inicial',
    });
    await request(app.getHttpServer())
      .post('/api/auth/set-password')
      .send({
        token: 'token-ficticio-inicial',
        password: 'Senha-ficticia-123!',
      })
      .expect(204);
    await seedAccessToken(
      database,
      'lavacao-sol-owner',
      'token-ficticio-recuperacao-concorrente',
      { purpose: 'RESET_PASSWORD' },
    );

    const attempts = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/reset-password').send({
        token: 'token-ficticio-recuperacao-concorrente',
        password: 'Nova-senha-ficticia-123!',
      }),
      request(app.getHttpServer()).post('/api/auth/reset-password').send({
        token: 'token-ficticio-recuperacao-concorrente',
        password: 'Nova-senha-ficticia-123!',
      }),
    ]);

    expect(attempts.map((response) => response.status).sort()).toEqual([
      204, 400,
    ]);
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });
});

async function seedOwner(
  database: TestDatabase,
  input: {
    carWashId: string;
    email: string;
    setupToken: string;
    expiresAt?: Date;
  },
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
        createHash('sha256').update(input.setupToken).digest('hex'),
        input.expiresAt ?? new Date(Date.now() + 3_600_000),
      ],
    );
  } finally {
    await client.end();
  }
}

async function authenticatedOwner(
  database: TestDatabase,
  app: INestApplication<App>,
  input: { carWashId: string; email: string },
): Promise<{ agent: ReturnType<typeof request.agent>; csrfToken: string }> {
  const setupToken = `token-ficticio-${input.carWashId}`;
  await seedOwner(database, { ...input, setupToken });

  await request(app.getHttpServer())
    .post('/api/auth/set-password')
    .send({ token: setupToken, password: 'Senha-ficticia-123!' })
    .expect(204);

  const agent = request.agent(app.getHttpServer());
  const response = await agent.post('/api/auth/login').send({
    email: input.email,
    password: 'Senha-ficticia-123!',
  });

  return { agent, csrfToken: response.body.csrfToken as string };
}

async function updateSessions(database: TestDatabase, assignment: string) {
  const client = database.client();
  await client.connect();
  try {
    await client.query(`UPDATE "Session" SET ${assignment}`);
  } finally {
    await client.end();
  }
}

async function seedAccessToken(
  database: TestDatabase,
  userId: string,
  token: string,
  options: {
    purpose?: 'SET_PASSWORD' | 'RESET_PASSWORD';
    expiresAt?: Date;
  } = {},
) {
  const client = database.client();
  await client.connect();
  try {
    await client.query(
      'INSERT INTO "AccessToken" (id, "userId", purpose, "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4, $5)',
      [
        randomUUID(),
        userId,
        options.purpose ?? 'SET_PASSWORD',
        createHash('sha256').update(token).digest('hex'),
        options.expiresAt ?? new Date(Date.now() + 3_600_000),
      ],
    );
  } finally {
    await client.end();
  }
}

async function countCarWashes(database: TestDatabase, slug: string) {
  const client = database.client();
  await client.connect();
  try {
    const result = await client.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM "CarWash" WHERE slug = $1',
      [slug],
    );
    return Number(result.rows[0].count);
  } finally {
    await client.end();
  }
}
