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

  it('permite ao funcionário registrar encaixe imediato com autoria e histórico do serviço', async () => {
    const fixture = await bookingFixture();
    await changeMembershipRole(database, 'lavacao-sol', 'EMPLOYEE');
    const publicAvailability = await request(app.getHttpServer())
      .get('/api/public/car-washes/lavacao-sol/availability')
      .query({
        serviceId: fixture.input.serviceId,
        date: '2026-09-10',
      })
      .expect(200);
    expect(publicAvailability.body.slots).not.toContainEqual({
      startsAt: '2026-09-10T12:00:00.000Z',
      endsAt: '2026-09-10T13:00:00.000Z',
    });
    const teamAvailability = await fixture.owner.agent
      .get('/api/car-washes/lavacao-sol/appointments/walk-in-availability')
      .query({
        serviceId: fixture.input.serviceId,
        date: '2026-09-10',
      })
      .expect(200);
    expect(teamAvailability.body.slots).toContainEqual({
      startsAt: '2026-09-10T12:00:00.000Z',
      endsAt: '2026-09-10T13:00:00.000Z',
    });
    const walkIn = await fixture.owner.agent
      .post('/api/car-washes/lavacao-sol/appointments/walk-ins')
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({
        serviceId: fixture.input.serviceId,
        startsAt: '2026-09-10T12:00:00.000Z',
        name: 'Cliente de Balcão',
        phone: '11988880001',
        plate: 'DEF4G56',
      })
      .expect(201);

    expect(walkIn.body).toMatchObject({
      status: 'CONFIRMED',
      origin: 'TEAM',
      serviceName: 'Lavagem completa',
      servicePriceInCents: 7500,
      serviceDurationInMinutes: 60,
      startsAt: '2026-09-10T12:00:00.000Z',
      endsAt: '2026-09-10T13:00:00.000Z',
      customer: { name: 'Cliente de Balcão', phone: '11988880001' },
      vehicle: { plate: 'DEF4G56' },
      createdBy: {
        id: 'lavacao-sol-owner-membership',
        user: { email: 'dona.sol@example.test' },
      },
    });

    await fixture
      .book({
        ...fixture.input,
        attemptId: randomUUID(),
        startsAt: '2026-09-10T12:00:00.000Z',
      })
      .expect(409);
    const agenda = await fixture.owner.agent
      .get('/api/car-washes/lavacao-sol/appointments')
      .query({ date: '2026-09-10' })
      .expect(200);
    expect(agenda.body.appointments).toEqual([
      expect.objectContaining({ id: walkIn.body.id, origin: 'TEAM' }),
    ]);

    await changeMembershipRole(database, 'lavacao-sol', 'OWNER');
    await fixture.owner.agent
      .patch(`/api/car-washes/lavacao-sol/services/${fixture.input.serviceId}`)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({
        name: 'Lavagem premium',
        priceInCents: 9900,
        durationInMinutes: 90,
        active: true,
      })
      .expect(200);
    const preserved = await fixture.owner.agent
      .get('/api/car-washes/lavacao-sol/appointments')
      .query({ date: '2026-09-10' })
      .expect(200);
    expect(preserved.body.appointments[0]).toMatchObject({
      serviceName: 'Lavagem completa',
      servicePriceInCents: 7500,
      serviceDurationInMinutes: 60,
    });

    const openApi = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    expect(
      openApi.body.paths[
        '/api/car-washes/{carWashId}/appointments/walk-in-availability'
      ].get.responses[200].description,
    ).toBe('Horários para encaixe, sem antecedência do autoagendamento');
    expect(
      openApi.body.paths['/api/car-washes/{carWashId}/appointments/walk-ins']
        .post.responses,
    ).toMatchObject({
      201: { description: 'Encaixe confirmado com origem e autoria da equipe' },
      409: { description: 'Horário indisponível' },
    });
  });

  it('isola o encaixe e serializa sua disputa com a reserva pública', async () => {
    const fixture = await bookingFixture();
    const ownerB = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dona.lua@example.test',
    });
    const path = '/api/car-washes/lavacao-sol/appointments/walk-ins';
    const walkInInput = {
      serviceId: fixture.input.serviceId,
      startsAt: fixture.input.startsAt,
      name: 'Cliente de Balcão',
      phone: '11988880001',
      plate: 'DEF4G56',
    };

    await request(app.getHttpServer()).post(path).send(walkInInput).expect(401);
    await fixture.owner.agent.post(path).send(walkInInput).expect(403);
    await ownerB.agent
      .post(path)
      .set('x-csrf-token', ownerB.csrfToken)
      .send(walkInInput)
      .expect(404);

    const [walkIn, publicBooking] = await Promise.all([
      fixture.owner.agent
        .post(path)
        .set('x-csrf-token', fixture.owner.csrfToken)
        .send(walkInInput),
      fixture.book(),
    ]);
    expect([
      [201, 409],
      [409, 201],
    ]).toContainEqual([walkIn.status, publicBooking.status]);

    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments).toHaveLength(1);
    expect(agenda.body.appointments[0]).toMatchObject(
      walkIn.status === 201
        ? {
            origin: 'TEAM',
            createdBy: {
              id: 'lavacao-sol-owner-membership',
              user: { email: 'dona.sol@example.test' },
            },
          }
        : { origin: 'PUBLIC', createdBy: null },
    );

    const client = database.client();
    await client.connect();
    try {
      await expect(
        client.query(
          `UPDATE "Appointment"
           SET origin = 'TEAM', "attemptHash" = NULL, "requestHash" = NULL,
               "createdByMembershipId" = 'lavacao-lua-owner-membership'
           WHERE id = $1`,
          [agenda.body.appointments[0].id],
        ),
      ).rejects.toMatchObject({ code: '23503' });
    } finally {
      await client.end();
    }
  });

  it('permite à equipe iniciar, concluir ou marcar falta com autoria, sem mover a agenda', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const future = await fixture
      .book({
        ...fixture.input,
        attemptId: randomUUID(),
        startsAt: '2026-09-11T14:00:00.000Z',
      })
      .expect(201);
    const path = `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/status`;
    const ownerB = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dona.lua@example.test',
    });

    await request(app.getHttpServer())
      .patch(path)
      .send({ status: 'IN_PROGRESS' })
      .expect(401);
    await fixture.owner.agent.patch(path).send({ status: 'IN_PROGRESS' }).expect(403);
    await ownerB.agent
      .patch(path)
      .set('x-csrf-token', ownerB.csrfToken)
      .send({ status: 'IN_PROGRESS' })
      .expect(404);
    await changeMembershipRole(database, 'lavacao-sol', 'EMPLOYEE');
    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'IN_PROGRESS' })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: receipt.body.id,
          status: 'IN_PROGRESS',
          statusChangedBy: {
            id: 'lavacao-sol-owner-membership',
            user: { email: 'dona.sol@example.test' },
          },
        });
        expect(response.body.statusChangedAt).toEqual(expect.any(String));
      });

    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'COMPLETED' })
      .expect(200)
      .expect((response) =>
        expect(response.body).toEqual(expect.objectContaining({ status: 'COMPLETED' })),
      );

    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments[0]).toMatchObject({
      id: receipt.body.id,
      status: 'COMPLETED',
      startsAt: fixture.input.startsAt,
      endsAt: '2026-09-11T13:00:00.000Z',
    });

    const absent = await fixture
      .book({ ...fixture.input, attemptId: randomUUID(), startsAt: '2026-09-11T13:00:00.000Z' })
      .expect(201);
    await fixture.owner.agent
      .patch(`/api/car-washes/lavacao-sol/appointments/${absent.body.id}/status`)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'NO_SHOW' })
      .expect(200)
      .expect((response) =>
        expect(response.body).toEqual(expect.objectContaining({ status: 'NO_SHOW' })),
      );

    const preservedFuture = (await fixture.agenda().expect(200)).body.appointments.find(
      (appointment: { id: string }) => appointment.id === future.body.id,
    );
    expect(preservedFuture).toMatchObject({
      startsAt: '2026-09-11T14:00:00.000Z',
      endsAt: '2026-09-11T15:00:00.000Z',
      status: 'CONFIRMED',
      box: { name: 'Box 0' },
    });

    const client = database.client();
    await client.connect();
    try {
      await expect(
        client.query(
          'INSERT INTO "AppointmentStatusChange" (id, "appointmentId", "carWashId", "previousStatus", status, "changedByMembershipId") VALUES ($1, $2, $3, $4, $5, $6)',
          [
            'mudanca-cruzada',
            receipt.body.id,
            'lavacao-lua',
            'CONFIRMED',
            'IN_PROGRESS',
            'lavacao-lua-owner-membership',
          ],
        ),
      ).rejects.toMatchObject({ code: '23503' });
    } finally {
      await client.end();
    }

    const openApi = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(
      openApi.body.paths['/api/car-washes/{carWashId}/appointments/{appointmentId}/status']
        .patch.responses,
    ).toMatchObject({
      200: {
        description:
          'Estado do atendimento atualizado com autoria, momento e metadados do cancelamento quando aplicável',
      },
      409: { description: 'Transição de estado inválida' },
    });
  });

  it('recusa transições inválidas, estado final e disputa de atualização', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const path = `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/status`;

    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'COMPLETED' })
      .expect(409);

    const [started, absent] = await Promise.all([
      fixture.owner.agent
        .patch(path)
        .set('x-csrf-token', fixture.owner.csrfToken)
        .send({ status: 'IN_PROGRESS' }),
      fixture.owner.agent
        .patch(path)
        .set('x-csrf-token', fixture.owner.csrfToken)
        .send({ status: 'NO_SHOW' }),
    ]);
    expect([started.status, absent.status].sort()).toEqual([200, 409]);

    const finalStatus = started.status === 200 ? 'COMPLETED' : 'NO_SHOW';
    if (finalStatus === 'COMPLETED') {
      await fixture.owner.agent
        .patch(path)
        .set('x-csrf-token', fixture.owner.csrfToken)
        .send({ status: 'COMPLETED' })
        .expect(200);
    }
    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'IN_PROGRESS' })
      .expect(409);
  });

  it('cancela após conferir o pedido, preserva seus horários e libera o box somente ao registrar a ação', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const path = `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/status`;
    const requestedAt = '2026-09-11T10:00:00.000Z';

    await fixture
      .book({ ...fixture.input, attemptId: randomUUID() })
      .expect(409);

    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'CANCELED', requestedAt })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: receipt.body.id,
          status: 'CANCELED',
          cancellationRequestedAt: requestedAt,
          cancellationReason: null,
        });
        expect(response.body.statusChangedAt).toEqual(expect.any(String));
      });

    await fixture
      .book({ ...fixture.input, attemptId: randomUUID() })
      .expect(201);

    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: receipt.body.id,
          status: 'CANCELED',
          cancellationRequestedAt: requestedAt,
        }),
      ]),
    );
  });

  it('aceita a exceção da equipe fora do prazo com motivo opcional e rejeita pedido tardio', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const path = `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/status`;

    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'CANCELED', requestedAt: '2026-09-11T10:00:00.000Z' })
      .expect(400)
      .expect((response) =>
        expect(response.body).toEqual(
          expect.objectContaining({
            message: 'Horário informado do pedido não pode estar no futuro',
          }),
        ),
      );

    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-09-11T11:45:00.000Z').getTime());

    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'CANCELED', requestedAt: '2026-09-11T11:30:00.000Z' })
      .expect(409);

    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({
        status: 'CANCELED',
        requestedAt: '2026-09-11T10:00:00.000Z',
        reason: 'Não deve ser aceito',
      })
      .expect(400);

    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'CANCELED', reason: 'Exceção operacional fictícia' })
      .expect(200)
      .expect((response) =>
        expect(response.body).toMatchObject({
          status: 'CANCELED',
          cancellationRequestedAt: null,
          cancellationReason: 'Exceção operacional fictícia',
        }),
      );
  });

  it('serializa o cancelamento com outra ação e com a nova reserva do mesmo horário', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const path = `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/status`;
    const [cancel, start] = await Promise.all([
      fixture.owner.agent
        .patch(path)
        .set('x-csrf-token', fixture.owner.csrfToken)
        .send({ status: 'CANCELED', reason: 'Exceção fictícia' }),
      fixture.owner.agent
        .patch(path)
        .set('x-csrf-token', fixture.owner.csrfToken)
        .send({ status: 'IN_PROGRESS' }),
    ]);
    expect([cancel.status, start.status].sort()).toEqual([200, 409]);

    if (cancel.status === 200) {
      await fixture
        .book({ ...fixture.input, attemptId: randomUUID() })
        .expect(201);
      return;
    }

    await fixture.owner.agent
      .patch(path)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({ status: 'COMPLETED' })
      .expect(200);
    await fixture
      .book({ ...fixture.input, attemptId: randomUUID() })
      .expect(409);
  });

  it('não deixa liberação parcial quando cancelamento e nova reserva disputam o mesmo box', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const path = `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/status`;
    const [canceled, replacement] = await Promise.all([
      fixture.owner.agent
        .patch(path)
        .set('x-csrf-token', fixture.owner.csrfToken)
        .send({ status: 'CANCELED', reason: 'Exceção fictícia' }),
      fixture.book({ ...fixture.input, attemptId: randomUUID() }),
    ]);
    expect(canceled.status).toBe(200);
    expect([201, 409]).toContain(replacement.status);
    if (replacement.status === 409) {
      await fixture
        .book({ ...fixture.input, attemptId: randomUUID() })
        .expect(201);
    }
  });

  it('permite à equipe corrigir cliente e veículo e mostra a correção na agenda', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const client = database.client();
    await client.connect();
    try {
      await client.query(
        `INSERT INTO "Appointment" (id, "carWashId", "customerId", "vehicleId", origin, "attemptHash", "requestHash", "boxId", "serviceOfferingId", "startsAt", "endsAt", "serviceName", "servicePriceInCents", "serviceDurationInMinutes", status)
         SELECT 'agendamento-mesmo-cliente', "carWashId", "customerId", "vehicleId", origin, 'tentativa-mesmo-cliente', 'requisicao-mesmo-cliente', "boxId", "serviceOfferingId", "startsAt" + interval '1 hour', "endsAt" + interval '1 hour', "serviceName", "servicePriceInCents", "serviceDurationInMinutes", status
         FROM "Appointment" WHERE id = $1`,
        [receipt.body.id],
      );
    } finally {
      await client.end();
    }
    await changeMembershipRole(database, 'lavacao-sol', 'EMPLOYEE');

    await fixture.owner.agent
      .patch(
        `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/customer-vehicle`,
      )
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({
        name: 'Cliente Corrigido',
        phone: '11988880001',
        plate: 'DEF4G56',
      })
      .expect(200)
      .expect({
        customer: { name: 'Cliente Corrigido', phone: '11988880001' },
        vehicle: { plate: 'DEF4G56' },
      });

    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments).toHaveLength(2);
    for (const appointment of agenda.body.appointments) {
      expect(appointment).toMatchObject({
        customer: { name: 'Cliente Corrigido', phone: '11988880001' },
        vehicle: { plate: 'DEF4G56' },
      });
    }

    const openApi = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const updateOperation =
      openApi.body.paths[
        '/api/car-washes/{carWashId}/appointments/{appointmentId}/customer-vehicle'
      ].patch;
    expect(updateOperation.responses).toMatchObject({
      200: {
        description: 'Dados operacionais de cliente e veículo corrigidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CustomerVehicleDto' },
          },
        },
      },
      404: { description: 'Agendamento não encontrado' },
    });
    expect(
      updateOperation.requestBody.content['application/json'].schema,
    ).toEqual({ $ref: '#/components/schemas/UpdateCustomerVehicleDto' });
    expect(
      openApi.body.components.schemas.UpdateCustomerVehicleDto,
    ).toMatchObject({
      required: ['name', 'phone', 'plate'],
      properties: {
        name: expect.any(Object),
        phone: expect.any(Object),
        plate: expect.any(Object),
      },
    });
  });

  it('isola a correção por sessão, CSRF e tenant sem criar acesso público', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const path = `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/customer-vehicle`;
    const correction = {
      name: 'Cliente Corrigido',
      phone: '11988880001',
      plate: 'DEF4G56',
    };
    const ownerB = await authenticatedOwner(database, app, {
      carWashId: 'lavacao-lua',
      email: 'dona.lua@example.test',
    });

    await request(app.getHttpServer()).patch(path).send(correction).expect(401);
    await fixture.owner.agent.patch(path).send(correction).expect(403);
    await ownerB.agent
      .patch(path)
      .set('x-csrf-token', ownerB.csrfToken)
      .send(correction)
      .expect(404);
    await ownerB.agent
      .patch(
        `/api/car-washes/lavacao-lua/appointments/${receipt.body.id}/customer-vehicle`,
      )
      .set('x-csrf-token', ownerB.csrfToken)
      .send(correction)
      .expect(404);
    await request(app.getHttpServer())
      .patch(
        `/api/public/car-washes/lavacao-sol/appointments/${receipt.body.id}/customer-vehicle`,
      )
      .send(correction)
      .expect(404);

    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments[0]).toMatchObject({
      customer: { name: 'Cliente Fictício', phone: '11999990001' },
      vehicle: { plate: 'ABC1D23' },
    });
  });

  it('desfaz toda a correção quando o veículo falha e responde sem dados do ORM', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const client = database.client();
    await client.connect();
    try {
      await client.query(
        `ALTER TABLE "Vehicle" ADD CONSTRAINT "test_reject_vehicle_correction" CHECK (plate <> 'DEF4G56')`,
      );
      await fixture.owner.agent
        .patch(
          `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/customer-vehicle`,
        )
        .set('x-csrf-token', fixture.owner.csrfToken)
        .send({
          name: 'Cliente Corrigido',
          phone: '11988880001',
          plate: 'DEF4G56',
        })
        .expect(503)
        .expect({
          message: 'Não foi possível atualizar os dados do atendimento',
          error: 'Service Unavailable',
          statusCode: 503,
        });
    } finally {
      await client.query(
        'ALTER TABLE "Vehicle" DROP CONSTRAINT "test_reject_vehicle_correction"',
      );
      await client.end();
    }

    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments[0]).toMatchObject({
      customer: { name: 'Cliente Fictício', phone: '11999990001' },
      vehicle: { plate: 'ABC1D23' },
    });
  });

  it('mantém um conjunto completo diante de correções concorrentes', async () => {
    const fixture = await bookingFixture();
    const receipt = await fixture.book().expect(201);
    const path = `/api/car-washes/lavacao-sol/appointments/${receipt.body.id}/customer-vehicle`;
    const corrections = [
      { name: 'Cliente Um', phone: '11988880001', plate: 'DEF4G56' },
      { name: 'Cliente Dois', phone: '11977770001', plate: 'HIJ7K89' },
    ];

    const responses = await Promise.all(
      corrections.map((correction) =>
        fixture.owner.agent
          .patch(path)
          .set('x-csrf-token', fixture.owner.csrfToken)
          .send(correction),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual([200, 200]);

    const appointment = (await fixture.agenda().expect(200)).body
      .appointments[0];
    expect(responses.map((response) => response.body)).toContainEqual({
      customer: appointment.customer,
      vehicle: appointment.vehicle,
    });
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

  it.each(['hours', 'box', 'service'] as const)(
    'serializa reserva contra retirada de disponibilidade: %s',
    async (change) => {
      const fixture = await bookingFixture();
      const mutations = {
        hours: () =>
          fixture.owner.agent
            .put('/api/car-washes/lavacao-sol/scheduling-settings')
            .set('x-csrf-token', fixture.owner.csrfToken)
            .send(defaultSettings([])),
        box: () =>
          fixture.owner.agent
            .patch(`/api/car-washes/lavacao-sol/boxes/${fixture.boxes[0]}`)
            .set('x-csrf-token', fixture.owner.csrfToken)
            .send({ active: false }),
        service: () =>
          fixture.owner.agent
            .patch(
              `/api/car-washes/lavacao-sol/services/${fixture.input.serviceId}`,
            )
            .set('x-csrf-token', fixture.owner.csrfToken)
            .send({
              name: 'Lavagem premium',
              priceInCents: 9900,
              durationInMinutes: 90,
              active: false,
            }),
      };
      const changeCanConflictWithExistingBooking = [
        [201, 409],
        [409, 200],
      ];
      const acceptedOutcomes = {
        hours: changeCanConflictWithExistingBooking,
        box: changeCanConflictWithExistingBooking,
        service: [
          [201, 200],
          [404, 200],
        ],
      };
      const [booking, mutationResponse] = await Promise.all([
        fixture.book(),
        mutations[change](),
      ]);
      expect(acceptedOutcomes[change]).toContainEqual([
        booking.status,
        mutationResponse.status,
      ]);
      const agenda = await fixture.agenda().expect(200);
      expect(agenda.body.appointments).toHaveLength(
        booking.status === 201 ? 1 : 0,
      );
      if (booking.status === 201) {
        expect(agenda.body.appointments[0]).toMatchObject({
          serviceName: 'Lavagem completa',
          servicePriceInCents: 7500,
          serviceDurationInMinutes: 60,
        });
      }
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

  it('usa o catálogo atualizado em novas reservas e preserva a reserva existente', async () => {
    const fixture = await bookingFixture();
    await fixture.book().expect(201);

    await fixture.owner.agent
      .patch(`/api/car-washes/lavacao-sol/services/${fixture.input.serviceId}`)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({
        name: 'Lavagem premium',
        priceInCents: 9900,
        durationInMinutes: 90,
        active: true,
      })
      .expect(200)
      .expect({
        id: fixture.input.serviceId,
        name: 'Lavagem premium',
        priceInCents: 9900,
        durationInMinutes: 90,
        active: true,
      });

    const newBooking = await fixture
      .book({
        ...fixture.input,
        attemptId: randomUUID(),
        startsAt: '2026-09-11T14:00:00.000Z',
      })
      .expect(201);
    expect(newBooking.body).toMatchObject({
      serviceName: 'Lavagem premium',
      servicePriceInCents: 9900,
      serviceDurationInMinutes: 90,
      endsAt: '2026-09-11T15:30:00.000Z',
    });
    const agenda = await fixture.agenda().expect(200);
    expect(agenda.body.appointments[0]).toMatchObject({
      serviceName: 'Lavagem completa',
      servicePriceInCents: 7500,
      serviceDurationInMinutes: 60,
    });

    await fixture.owner.agent
      .patch(`/api/car-washes/lavacao-sol/services/${fixture.input.serviceId}`)
      .set('x-csrf-token', fixture.owner.csrfToken)
      .send({
        name: 'Lavagem premium',
        priceInCents: 9900,
        durationInMinutes: 90,
        active: false,
      })
      .expect(200);
    await fixture
      .book({
        ...fixture.input,
        attemptId: randomUUID(),
        startsAt: '2026-09-11T16:00:00.000Z',
      })
      .expect(404);
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
