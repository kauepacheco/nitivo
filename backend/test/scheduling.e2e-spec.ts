import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { startTestDatabase, TestDatabase } from './support/test-database';

describe('Configuração da agenda e disponibilidade (e2e)', () => {
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('expõe ao proprietário os padrões de configuração da agenda', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });

    await owner.agent
      .get('/api/car-washes/lavacao-sol/scheduling-settings')
      .expect(200)
      .expect({
        timezone: 'America/Sao_Paulo',
        minimumBookingNoticeMinutes: 60,
        bookingHorizonDays: 30,
        changeNoticeMinutes: 120,
        slotIntervalMinutes: 30,
        weeklyHours: [],
        boxes: [],
      });
  });

  it('permite ao proprietário configurar capacidade, expediente e políticas somente na própria lavação', async () => {
    const ownerA = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    const ownerB = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dona.lua@example.test',
    });

    const box = await ownerA.agent
      .post('/api/car-washes/lavacao-sol/boxes')
      .set('x-csrf-token', ownerA.csrfToken)
      .send({ name: 'Box principal' })
      .expect(201);
    expect(box.body).toEqual({
      id: expect.any(String),
      name: 'Box principal',
      active: true,
    });

    await ownerA.agent
      .put('/api/car-washes/lavacao-sol/scheduling-settings')
      .set('x-csrf-token', ownerA.csrfToken)
      .send({
        minimumBookingNoticeMinutes: 90,
        bookingHorizonDays: 21,
        changeNoticeMinutes: 180,
        slotIntervalMinutes: 15,
        weeklyHours: [
          { weekday: 1, opensAt: '08:00', closesAt: '18:00' },
          { weekday: 6, opensAt: '08:00', closesAt: '12:00' },
        ],
      })
      .expect(200)
      .expect({
        timezone: 'America/Sao_Paulo',
        minimumBookingNoticeMinutes: 90,
        bookingHorizonDays: 21,
        changeNoticeMinutes: 180,
        slotIntervalMinutes: 15,
        weeklyHours: [
          { weekday: 1, opensAt: '08:00', closesAt: '18:00' },
          { weekday: 6, opensAt: '08:00', closesAt: '12:00' },
        ],
        boxes: [box.body],
      });

    await ownerB.agent
      .get('/api/car-washes/lavacao-sol/scheduling-settings')
      .expect(404);
    await ownerB.agent
      .post('/api/car-washes/lavacao-sol/boxes')
      .set('x-csrf-token', ownerB.csrfToken)
      .send({ name: 'Box invasor' })
      .expect(404);

    await changeMembershipRole(database, 'lavacao-lua', 'EMPLOYEE');
    await ownerB.agent
      .get('/api/car-washes/lavacao-lua/scheduling-settings')
      .expect(404);
  });

  it('calcula horários públicos pela duração, expediente, antecedência e capacidade persistida', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-09-10T12:00:00.000Z').getTime());

    const service = await owner.agent
      .post('/api/car-washes/lavacao-sol/services')
      .set('x-csrf-token', owner.csrfToken)
      .send({
        name: 'Lavagem completa',
        priceInCents: 7500,
        durationInMinutes: 60,
        active: true,
      })
      .expect(201);
    const boxes = [];
    for (const name of ['Box 1', 'Box 2']) {
      const box = await owner.agent
        .post('/api/car-washes/lavacao-sol/boxes')
        .set('x-csrf-token', owner.csrfToken)
        .send({ name })
        .expect(201);
      boxes.push(box.body as { id: string });
    }
    await owner.agent
      .put('/api/car-washes/lavacao-sol/scheduling-settings')
      .set('x-csrf-token', owner.csrfToken)
      .send({
        minimumBookingNoticeMinutes: 60,
        bookingHorizonDays: 30,
        changeNoticeMinutes: 120,
        slotIntervalMinutes: 30,
        weeklyHours: [
          { weekday: 4, opensAt: '08:00', closesAt: '18:00' },
          { weekday: 5, opensAt: '08:00', closesAt: '12:00' },
        ],
      })
      .expect(200);
    await seedAppointments(database, {
      carWashId: 'lavacao-sol',
      serviceOfferingId: service.body.id as string,
      boxIds: boxes.map((box) => box.id),
      startsAt: '2026-09-11T12:00:00.000Z',
      endsAt: '2026-09-11T13:00:00.000Z',
    });

    await request(app.getHttpServer())
      .get('/api/public/car-washes/lavacao-sol/availability')
      .query({ serviceId: service.body.id, date: '2026-09-11' })
      .expect(200)
      .expect({
        date: '2026-09-11',
        timezone: 'America/Sao_Paulo',
        slots: [
          {
            startsAt: '2026-09-11T11:00:00.000Z',
            endsAt: '2026-09-11T12:00:00.000Z',
          },
          {
            startsAt: '2026-09-11T13:00:00.000Z',
            endsAt: '2026-09-11T14:00:00.000Z',
          },
          {
            startsAt: '2026-09-11T13:30:00.000Z',
            endsAt: '2026-09-11T14:30:00.000Z',
          },
          {
            startsAt: '2026-09-11T14:00:00.000Z',
            endsAt: '2026-09-11T15:00:00.000Z',
          },
        ],
      });

    const today = await request(app.getHttpServer())
      .get('/api/public/car-washes/lavacao-sol/availability')
      .query({ serviceId: service.body.id, date: '2026-09-10' })
      .expect(200);
    expect(today.body.slots[0].startsAt).toBe('2026-09-10T13:00:00.000Z');
    expect(today.body.slots.at(-1).endsAt).toBe('2026-09-10T21:00:00.000Z');

    await request(app.getHttpServer())
      .get('/api/public/car-washes/lavacao-sol/availability')
      .query({ serviceId: service.body.id, date: '2026-09-09' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/public/car-washes/lavacao-sol/availability')
      .query({ serviceId: service.body.id, date: '2026-10-11' })
      .expect(400);
  });

  it('mostra conflitos e preserva reservas ao reduzir expediente ou desativar box', async () => {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    const service = await owner.agent
      .post('/api/car-washes/lavacao-sol/services')
      .set('x-csrf-token', owner.csrfToken)
      .send({
        name: 'Lavagem completa',
        priceInCents: 7500,
        durationInMinutes: 60,
        active: true,
      })
      .expect(201);
    const box = await owner.agent
      .post('/api/car-washes/lavacao-sol/boxes')
      .set('x-csrf-token', owner.csrfToken)
      .send({ name: 'Box principal' })
      .expect(201);
    await owner.agent
      .put('/api/car-washes/lavacao-sol/scheduling-settings')
      .set('x-csrf-token', owner.csrfToken)
      .send(defaultSettings(allWeekdays()))
      .expect(200);
    await seedAppointments(database, {
      carWashId: 'lavacao-sol',
      serviceOfferingId: service.body.id as string,
      boxIds: [box.body.id as string],
      startsAt: '2099-09-11T12:00:00.000Z',
      endsAt: '2099-09-11T13:00:00.000Z',
    });

    const deactivation = await owner.agent
      .patch(`/api/car-washes/lavacao-sol/boxes/${box.body.id}`)
      .set('x-csrf-token', owner.csrfToken)
      .send({ active: false })
      .expect(409);
    expect(deactivation.body).toMatchObject({
      message: 'A mudança conflita com reservas futuras',
      conflicts: [{ appointmentId: 'agendamento-0' }],
    });

    const scheduleChange = await owner.agent
      .put('/api/car-washes/lavacao-sol/scheduling-settings')
      .set('x-csrf-token', owner.csrfToken)
      .send(defaultSettings([]))
      .expect(409);
    expect(scheduleChange.body).toMatchObject({
      message: 'A mudança conflita com reservas futuras',
      conflicts: [{ appointmentId: 'agendamento-0' }],
    });

    const preserved = await owner.agent
      .get('/api/car-washes/lavacao-sol/scheduling-settings')
      .expect(200);
    expect(preserved.body.boxes).toEqual([{ ...box.body, active: true }]);
    expect(preserved.body.weeklyHours).toEqual(allWeekdays());
    expect(await appointmentCount(database)).toBe(1);
  });

  it('confirma reserva pública e a apresenta na agenda sem depender de WhatsApp', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    expect(receipt.body).toMatchObject({
      status: 'CONFIRMED',
      operationalContactPhone: '5511999990001',
      serviceName: 'Lavagem completa',
      servicePriceInCents: 7500,
      serviceDurationInMinutes: 60,
      startsAt: '2026-09-11T12:00:00.000Z',
      endsAt: '2026-09-11T13:00:00.000Z',
    });
    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments).toEqual([
      expect.objectContaining({
        id: receipt.body.id,
        customer: { name: 'Cliente Fictício', phone: '11999990001' },
        vehicle: { plate: 'ABC1D23' },
      }),
    ]);
  });

  async function bookingFixture(boxCount = 1) {
    const owner = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-sol',
      email: 'dona.sol@example.test',
    });
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-09-10T12:00:00Z').getTime());
    await owner.agent
      .patch('/api/car-washes/lavacao-sol/public-profile')
      .set('x-csrf-token', owner.csrfToken)
      .send({ operationalContactPhone: '5511999990001' })
      .expect(200);
    const service = await owner.agent
      .post('/api/car-washes/lavacao-sol/services')
      .set('x-csrf-token', owner.csrfToken)
      .send({
        name: 'Lavagem completa',
        priceInCents: 7500,
        durationInMinutes: 60,
        active: true,
      })
      .expect(201);
    const boxes: string[] = [];
    for (let index = 0; index < boxCount; index++) {
      const box = await owner.agent
        .post('/api/car-washes/lavacao-sol/boxes')
        .set('x-csrf-token', owner.csrfToken)
        .send({ name: `Box ${index}` })
        .expect(201);
      boxes.push(box.body.id as string);
    }
    await owner.agent
      .put('/api/car-washes/lavacao-sol/scheduling-settings')
      .set('x-csrf-token', owner.csrfToken)
      .send(defaultSettings(allWeekdays()))
      .expect(200);
    const input = {
      attemptId: randomUUID(),
      serviceId: service.body.id as string,
      startsAt: '2026-09-11T12:00:00.000Z',
      name: 'Cliente Fictício',
      phone: '11999990001',
      plate: 'ABC1D23',
    };
    return {
      owner,
      input,
      boxes,
      book: (body = input) =>
        request(app.getHttpServer())
          .post('/api/public/car-washes/lavacao-sol/appointments')
          .send(body),
      agenda: () =>
        owner.agent
          .get('/api/car-washes/lavacao-sol/appointments')
          .query({ date: '2026-09-11' }),
    };
  }

  it('reenvios simultâneos não duplicam e a mesma chave não aceita outro conteúdo nem consulta posterior', async () => {
    const fixture = await bookingFixture(2);
    const responses = await Promise.all([fixture.book(), fixture.book()]);
    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    await fixture.book({ ...fixture.input, name: 'Outro Cliente' }).expect(409);
    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments).toHaveLength(1);
    expect(responses[0].body).not.toHaveProperty('customer');
    expect(responses[0].body).not.toHaveProperty('attemptHash');
    await request(app.getHttpServer())
      .get(
        `/api/public/car-washes/lavacao-sol/appointments/${responses[0].body.id}`,
      )
      .expect(404);
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-09-10T12:16:00Z').getTime());
    await fixture.book().expect(409);
  });

  it('limita reservas concorrentes à capacidade e permite início no término anterior', async () => {
    const fixture = await bookingFixture(2);
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        fixture.book({ ...fixture.input, attemptId: randomUUID() }),
      ),
    );
    expect(results.filter((result) => result.status === 201)).toHaveLength(2);
    expect(results.filter((result) => result.status === 409)).toHaveLength(3);
    await fixture
      .book({
        ...fixture.input,
        attemptId: randomUUID(),
        startsAt: '2026-09-11T13:00:00.000Z',
      })
      .expect(201);
    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments).toHaveLength(3);
    const client = database.client();
    await client.connect();
    try {
      const counts = await client.query(
        'SELECT (SELECT count(*) FROM "Customer") AS customers, (SELECT count(*) FROM "Vehicle") AS vehicles',
      );
      expect(counts.rows[0]).toEqual({ customers: '3', vehicles: '3' });
    } finally {
      await client.end();
    }
  });

  it.each(['hours', 'box'] as const)(
    'serializa reserva contra retirada de disponibilidade: %s',
    async (change) => {
      const fixture = await bookingFixture();
      const mutation =
        change === 'hours'
          ? fixture.owner.agent
              .put('/api/car-washes/lavacao-sol/scheduling-settings')
              .set('x-csrf-token', fixture.owner.csrfToken)
              .send(defaultSettings([]))
          : fixture.owner.agent
              .patch(`/api/car-washes/lavacao-sol/boxes/${fixture.boxes[0]}`)
              .set('x-csrf-token', fixture.owner.csrfToken)
              .send({ active: false });
      const [booking, settings] = await Promise.all([fixture.book(), mutation]);
      expect([
        [201, 409],
        [409, 200],
      ]).toContainEqual([booking.status, settings.status]);
      const agenda = await fixture.agenda().expect(200);
      expect(agenda.body.appointments).toHaveLength(
        booking.status === 201 ? 1 : 0,
      );
    },
  );

  it('revalida serviço, expediente, antecedência e horário na confirmação sem gravações parciais', async () => {
    const fixture = await bookingFixture();
    for (const startsAt of [
      '2026-09-09T12:00:00.000Z',
      '2026-10-11T12:00:00.000Z',
      '2026-09-10T12:30:00.000Z',
      '2026-09-11T12:15:00.000Z',
      '2026-09-11T20:30:00.000Z',
      '2026-02-30T12:00:00.000Z',
    ]) {
      const result = await fixture.book({ ...fixture.input, startsAt });
      expect([400, 409]).toContain(result.status);
    }
    await fixture
      .book({ ...fixture.input, serviceId: 'servico-outra-lavacao' })
      .expect(404);
    await fixture.book({ ...fixture.input, phone: '123' }).expect(400);
    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments).toEqual([]);
  });

  it('agenda exige vínculo ativo de proprietário ou funcionário e mantém o histórico do serviço', async () => {
    const fixture = await bookingFixture();
    await fixture.book().expect(201);
    const ownerB = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dona.lua@example.test',
    });
    await request(app.getHttpServer())
      .get('/api/car-washes/lavacao-sol/appointments')
      .expect(401);
    await ownerB.agent
      .get('/api/car-washes/lavacao-sol/appointments')
      .expect(404);
    await ownerB.agent
      .get('/api/car-washes/lavacao-lua/appointments')
      .expect(200)
      .expect((response) => {
        expect(response.body.appointments).toEqual([]);
        expect(response.body.upcoming).toEqual([]);
      });
    await changeMembershipRole(database, 'lavacao-sol', 'EMPLOYEE');
    const client = database.client();
    await client.connect();
    try {
      await client.query(
        'UPDATE "ServiceOffering" SET name = $1, "priceInCents" = 9900, "durationInMinutes" = 90, active = false WHERE id = $2',
        ['Novo serviço', fixture.input.serviceId],
      );
      const agenda = await fixture.agenda().expect(200);
      expect(agenda.body.appointments[0]).toMatchObject({
        serviceName: 'Lavagem completa',
        servicePriceInCents: 7500,
        serviceDurationInMinutes: 60,
        origin: 'PUBLIC',
      });
      expect(agenda.body.upcoming).toHaveLength(1);
      await fixture
        .book({
          ...fixture.input,
          attemptId: randomUUID(),
          startsAt: '2026-09-11T14:00:00.000Z',
        })
        .expect(404);
      await client.query(
        'UPDATE "Membership" SET status = $1 WHERE "carWashId" = $2',
        ['REVOKED', 'lavacao-sol'],
      );
      await fixture.agenda().expect(401);
    } finally {
      await client.end();
    }
  });

  it('PostgreSQL recusa sobreposição e associação a cliente de outra lavação', async () => {
    const fixture = await bookingFixture();
    const booking = await fixture.book().expect(201);
    const client = database.client();
    await client.connect();
    try {
      await expect(
        client.query(
          `INSERT INTO "Appointment" (id, "carWashId", "boxId", "serviceOfferingId", "startsAt", "endsAt", "serviceName", "servicePriceInCents", "serviceDurationInMinutes")
        SELECT 'ocupacao-invasora', "carWashId", "boxId", "serviceOfferingId", "startsAt", "endsAt", "serviceName", "servicePriceInCents", "serviceDurationInMinutes" FROM "Appointment" WHERE id = $1`,
          [booking.body.id],
        ),
      ).rejects.toMatchObject({ code: '23P01' });
      await client.query(
        `INSERT INTO "CarWash" (id, name, slug) VALUES ('lavacao-lua', 'Lavação Lua', 'lavacao-lua')`,
      );
      await client.query(
        `INSERT INTO "Customer" (id, "carWashId", name, phone) VALUES ('cliente-lua', 'lavacao-lua', 'Cliente Lua', '11999990002')`,
      );
      await expect(
        client.query(
          `UPDATE "Appointment" SET "customerId" = 'cliente-lua' WHERE id = $1`,
          [booking.body.id],
        ),
      ).rejects.toMatchObject({ code: '23503' });
    } finally {
      await client.end();
    }
    expect((await fixture.agenda().expect(200)).body.appointments).toHaveLength(
      1,
    );
  });

  it('falha ao persistir veículo desfaz também o cliente e permite repetir a tentativa', async () => {
    const fixture = await bookingFixture();
    const client = database.client();
    await client.connect();
    try {
      await client.query(
        `ALTER TABLE "Vehicle" ADD CONSTRAINT "test_reject_vehicle" CHECK (plate <> 'ABC1D23')`,
      );
      await fixture.book().expect(503);
      const counts = await client.query(
        'SELECT (SELECT count(*) FROM "Customer") AS customers, (SELECT count(*) FROM "Vehicle") AS vehicles',
      );
      expect(counts.rows[0]).toEqual({ customers: '0', vehicles: '0' });
    } finally {
      await client.query(
        'ALTER TABLE "Vehicle" DROP CONSTRAINT "test_reject_vehicle"',
      );
      await client.end();
    }
    expect((await fixture.agenda().expect(200)).body.appointments).toEqual([]);
    await fixture.book().expect(201);
  });

  it('limita tentativas públicas inclusive corpos inválidos', async () => {
    for (let index = 0; index < 20; index++) {
      await request(app.getHttpServer())
        .post('/api/public/car-washes/inexistente/appointments')
        .send({})
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/api/public/car-washes/inexistente/appointments')
      .send({})
      .expect(429);
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });
});

function defaultSettings(weeklyHours: ReturnType<typeof allWeekdays>) {
  return {
    minimumBookingNoticeMinutes: 60,
    bookingHorizonDays: 30,
    changeNoticeMinutes: 120,
    slotIntervalMinutes: 30,
    weeklyHours,
  };
}

function allWeekdays() {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    opensAt: '08:00',
    closesAt: '18:00',
  }));
}

async function appointmentCount(database: TestDatabase) {
  const client = database.client();
  await client.connect();
  try {
    const result = await client.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM "Appointment"',
    );
    return Number(result.rows[0].count);
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

async function seedAppointments(
  database: TestDatabase,
  input: {
    carWashId: string;
    serviceOfferingId: string;
    boxIds: string[];
    startsAt: string;
    endsAt: string;
  },
) {
  const client = database.client();
  await client.connect();
  try {
    for (const [index, boxId] of input.boxIds.entries()) {
      await client.query(
        'INSERT INTO "Appointment" (id, "carWashId", "boxId", "serviceOfferingId", "startsAt", "endsAt", "serviceName", "servicePriceInCents", "serviceDurationInMinutes", status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          `agendamento-${index}`,
          input.carWashId,
          boxId,
          input.serviceOfferingId,
          input.startsAt,
          input.endsAt,
          'Lavagem completa',
          7500,
          60,
          'CONFIRMED',
        ],
      );
    }
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
  const client = database.client();
  await client.connect();
  try {
    const userId = `${input.carWashId}-owner`;
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
        new Date(new Date().getTime() + 3_600_000),
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
  const response = await agent.post('/api/auth/login').send({
    email: input.email,
    password: 'Senha-ficticia-123!',
  });

  return { agent, csrfToken: response.body.csrfToken as string };
}
