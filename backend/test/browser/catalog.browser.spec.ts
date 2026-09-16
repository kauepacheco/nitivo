import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  availablePort,
  startTestDatabase,
  TestDatabase,
} from '../support/test-database';

let server: ChildProcess;
let database: TestDatabase;
let baseUrl: string;

test.beforeAll(async () => {
  database = await startTestDatabase();
  const port = await availablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['dist/main.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      APP_URL: baseUrl,
      NODE_ENV: 'test',
    },
    stdio: 'pipe',
  });
  await waitForHealth(baseUrl, server);
});

test.afterAll(async () => {
  if (server?.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill('SIGTERM');
    await exited;
  }
  await database?.stop();
});

test.beforeEach(async () => {
  await database.reset();
});

async function waitForHealth(url: string, child: ChildProcess) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`A aplicação encerrou com código ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // A aplicação ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('A aplicação não iniciou a tempo');
}

test('proprietário cadastra, edita e desativa um serviço no celular', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const outputFile = join(tmpdir(), `nitivo-browser-link-${randomUUID()}.txt`);
  execFileSync(
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
      env: { ...process.env, APP_URL: baseUrl },
      encoding: 'utf8',
    },
  );
  const setupLink = readFileSync(outputFile, 'utf8').trim();
  unlinkSync(outputFile);

  await page.goto(setupLink);
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Definir senha' }).click();

  await expect(
    page.getByRole('heading', { name: 'Acesse sua lavação' }),
  ).toBeVisible();
  await page.getByLabel('E-mail').fill('dona.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(
    page.getByRole('heading', { name: 'Serviços da sua lavação' }),
  ).toBeVisible();
  await page.getByLabel('Nome', { exact: true }).fill('Lavagem completa');
  await page.getByLabel('Preço (R$)').fill('75.00');
  await page.getByLabel('Duração (min)').fill('90');
  await page.getByRole('button', { name: 'Cadastrar serviço' }).click();

  await expect(page.getByText('Serviço cadastrado.')).toBeVisible();
  await expect(
    page.getByText('Lavagem completa', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('90 min · Ativo')).toBeVisible();
  await expect(page.getByText('R$ 75,00')).toBeVisible();

  const service = page
    .getByRole('listitem')
    .filter({ hasText: 'Lavagem completa' });
  await service.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Nome do serviço').fill('Lavagem premium');
  await page.getByLabel('Preço do serviço (R$)').fill('99.00');
  await page.getByLabel('Duração do serviço (min)').fill('120');
  await page.getByLabel('Serviço disponível').uncheck();
  await page.getByRole('button', { name: 'Salvar alterações' }).click();

  await expect(page.getByText('Serviço atualizado.')).toBeVisible();
  const updatedService = page
    .getByRole('listitem')
    .filter({ hasText: 'Lavagem premium' });
  await expect(
    updatedService.getByText('Lavagem premium', { exact: true }),
  ).toBeVisible();
  await expect(updatedService.getByText('120 min · Inativo')).toBeVisible();
  await expect(updatedService.getByText('R$ 99,00')).toBeVisible();
  await page.goto(`${baseUrl}/lavacoes/lavacao-horizonte`);
  await expect(page.getByText('Lavagem premium')).not.toBeVisible();
});

test('cliente consulta serviços ativos e contato da lavação no celular', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const setupLink = provisionOwner({
    baseUrl,
    carWashName: 'Lavação Horizonte',
    slug: 'lavacao-horizonte',
    email: 'dona.horizonte@example.test',
  });
  await page.goto(setupLink);
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Definir senha' }).click();
  await page.getByLabel('E-mail').fill('dona.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await page.getByLabel('Telefone operacional com DDD').fill('(11) 99999-0001');
  await page
    .getByRole('button', { name: 'Salvar informações públicas' })
    .click();
  await expect(
    page.getByText('Informações públicas atualizadas.'),
  ).toBeVisible();

  await page.getByLabel('Nome', { exact: true }).fill('Lavagem completa');
  await page.getByLabel('Preço (R$)').fill('75.00');
  await page.getByLabel('Duração (min)').fill('90');
  await page.getByRole('button', { name: 'Cadastrar serviço' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Serviço inativo');
  await page.getByLabel('Preço (R$)').fill('10.00');
  await page.getByLabel('Duração (min)').fill('15');
  await page.getByLabel('Serviço ativo').uncheck();
  await page.getByRole('button', { name: 'Cadastrar serviço' }).click();

  await page.goto(`${baseUrl}/lavacoes/lavacao-horizonte`);
  await expect(
    page.getByRole('heading', { name: 'Lavação Horizonte' }),
  ).toBeVisible();
  await expect(
    page.getByText('Lavagem completa', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('90 min', { exact: true })).toBeVisible();
  await expect(page.getByText('R$ 75,00')).toBeVisible();
  await expect(page.getByText('Contato: +5511999990001')).toBeVisible();
  await expect(page.getByText('Serviço inativo')).not.toBeVisible();
});

test('proprietário configura capacidade e cliente consulta horários no celular', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const setupLink = provisionOwner({
    baseUrl,
    carWashName: 'Lavação Horizonte',
    slug: 'lavacao-horizonte',
    email: 'dona.horizonte@example.test',
  });
  await page.goto(setupLink);
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Definir senha' }).click();
  await page.getByLabel('E-mail').fill('dona.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await page.getByLabel('Telefone operacional com DDD').fill('(11) 99999-0001');
  await page
    .getByRole('button', { name: 'Salvar informações públicas' })
    .click();
  await page.getByLabel('Nome', { exact: true }).fill('Lavagem completa');
  await page.getByLabel('Preço (R$)').fill('75.00');
  await page.getByLabel('Duração (min)').fill('60');
  await page.getByRole('button', { name: 'Cadastrar serviço' }).click();

  await expect(
    page.getByRole('heading', { name: 'Capacidade e agenda' }),
  ).toBeVisible();
  await page.getByLabel('Nome do box').fill('Box principal');
  await page.getByRole('button', { name: 'Cadastrar box' }).click();
  const date = futureDateInSaoPaulo(1);
  const weekdayLabel = weekdayLabels[new Date(`${date}T12:00:00Z`).getUTCDay()];
  await page.getByLabel(`${weekdayLabel} aberto`).check();
  await page.getByRole('button', { name: 'Salvar agenda' }).click();
  await expect(page.getByText('Agenda atualizada.')).toBeVisible();

  await page.goto(`${baseUrl}/lavacoes/lavacao-horizonte`);
  await page.getByLabel('Serviço para agendar').selectOption({
    label: 'Lavagem completa — 60 min',
  });
  await page.getByLabel('Data do atendimento').fill(date);
  await page.getByRole('button', { name: 'Consultar horários' }).click();
  await expect(page.getByRole('button', { name: '08:00' })).toBeVisible();
  await page.getByRole('button', { name: '08:00' }).click();
  await page.getByLabel('Seu nome').fill('Cliente Fictício');
  await page.getByLabel('Telefone com DDD').fill('11999990001');
  await page.getByLabel('Placa do veículo').fill('ABC1D23');
  await page.route(
    '**/api/public/car-washes/lavacao-horizonte/appointments',
    async (route) => {
      await route.fetch();
      await route.abort('connectionreset');
    },
    { times: 1 },
  );
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  await expect(
    page.getByRole('button', { name: 'Tentar novamente' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(
    page.getByRole('heading', { name: 'Reserva confirmada' }),
  ).toBeVisible();
  await expect(
    page.getByText('Sua reserva está confirmada mesmo sem enviar mensagem.'),
  ).toBeVisible();
  const reference = await page.locator('.booking-reference').textContent();
  const localDate = `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
  const message = [
    'Olá! Tenho uma reserva confirmada na Lavação Horizonte.',
    'Serviço: Lavagem completa',
    `Data e horário: ${localDate} às 08:00`,
    `Referência: ${reference}`,
    'Gostaria de falar com a equipe sobre essa reserva.',
  ].join('\n');
  await expect(
    page.getByRole('link', { name: 'Abrir conversa no WhatsApp' }),
  ).toHaveAttribute(
    'href',
    `https://wa.me/5511999990001?text=${encodeURIComponent(message)}`,
  );
  await expect(
    page.getByText(
      'Abrir a conversa não envia a mensagem nem verifica seu telefone.',
    ),
  ).toBeVisible();
  await page.goto(baseUrl);
  await page.getByLabel('Dia da agenda').fill(date);
  await expect(
    page.getByLabel('Agenda diária').getByText('Cliente Fictício'),
  ).toBeVisible();
  await expect(
    page.getByLabel('Agenda diária').getByText('ABC1D23', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Próximos atendimentos').getByText('Cliente Fictício'),
  ).toBeVisible();
  await expect(page.getByLabel('Agenda diária').locator('li')).toHaveCount(1);

  const dailyAppointment = page
    .getByLabel('Agenda diária')
    .getByRole('listitem');
  await dailyAppointment
    .getByRole('button', { name: 'Corrigir cliente e veículo' })
    .click();
  await dailyAppointment
    .getByLabel('Nome do cliente')
    .fill('Cliente Corrigido');
  await dailyAppointment
    .getByLabel('Telefone do cliente')
    .fill('(11) 98888-0001');
  await dailyAppointment.getByLabel('Placa do veículo').fill('DEF-4G56');
  await dailyAppointment
    .getByRole('button', { name: 'Salvar dados do atendimento' })
    .click();

  await expect(
    page.getByText('Dados do atendimento atualizados.'),
  ).toBeVisible();
  await expect(
    page.getByLabel('Agenda diária').getByText('Cliente Corrigido'),
  ).toBeVisible();
  await expect(
    page.getByLabel('Próximos atendimentos').getByText('Cliente Corrigido'),
  ).toBeVisible();
  await expect(
    page
      .getByLabel('Agenda diária')
      .getByText('Telefone informado: 11988880001'),
  ).toBeVisible();
  await expect(
    page.getByLabel('Agenda diária').getByText('Placa: DEF4G56'),
  ).toBeVisible();

  await dailyAppointment.getByRole('button', { name: 'Reagendar' }).click();
  await dailyAppointment.getByLabel('Data do reagendamento').fill(date);
  await dailyAppointment
    .getByLabel('Horário informado do pedido de reagendamento')
    .fill(`${futureDateInSaoPaulo(-1)}T06:00`);
  await dailyAppointment
    .getByRole('button', { name: 'Consultar horários para reagendar' })
    .click();
  await dailyAppointment
    .getByLabel('Horários para reagendamento')
    .getByRole('button', { name: '09:00' })
    .click();
  await dailyAppointment
    .getByRole('button', { name: 'Confirmar reagendamento' })
    .click();
  await expect(page.getByText('Agendamento reagendado.')).toBeVisible();
  await expect(dailyAppointment).toContainText('09:00');
  await expect(dailyAppointment).toContainText(
    /Pedido de reagendamento: .* às 06:00/,
  );
  await expect(dailyAppointment).toContainText(
    /Reagendado por dona\.horizonte@example\.test em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/,
  );

  let releaseCorrection!: () => void;
  const heldCorrection = new Promise<void>((resolve) => {
    releaseCorrection = resolve;
  });
  let correctionPersisted!: () => void;
  const persisted = new Promise<void>((resolve) => {
    correctionPersisted = resolve;
  });
  await page.route(
    '**/api/car-washes/*/appointments/*/customer-vehicle',
    async (route) => {
      const response = await route.fetch();
      correctionPersisted();
      await heldCorrection;
      await route.fulfill({ response });
    },
    { times: 1 },
  );
  await dailyAppointment
    .getByRole('button', { name: 'Corrigir cliente e veículo' })
    .click();
  const correctionRequest = page.waitForRequest(
    (request) =>
      request.method() === 'PATCH' &&
      request.url().endsWith('/customer-vehicle'),
  );
  await dailyAppointment
    .getByRole('button', { name: 'Salvar dados do atendimento' })
    .click();
  await correctionRequest;
  await persisted;
  await page.getByLabel('Dia da agenda').fill(futureDateInSaoPaulo(2));
  await expect(
    page
      .getByLabel('Agenda diária')
      .getByText('Nenhum atendimento neste período.'),
  ).toBeVisible();
  releaseCorrection();
  await expect(
    page.getByLabel('Agenda diária').getByText('Cliente Corrigido'),
  ).not.toBeVisible();
});

test('equipe registra encaixe pela agenda no celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const setupLink = provisionOwner({
    baseUrl,
    carWashName: 'Lavação Horizonte',
    slug: 'lavacao-horizonte',
    email: 'dona.horizonte@example.test',
  });
  await page.goto(setupLink);
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Definir senha' }).click();
  await page.getByLabel('E-mail').fill('dona.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await page.getByLabel('Nome', { exact: true }).fill('Lavagem expressa');
  await page.getByLabel('Preço (R$)').fill('45.00');
  await page.getByLabel('Duração (min)').fill('60');
  await page.getByRole('button', { name: 'Cadastrar serviço' }).click();
  await page.getByLabel('Nome do box').fill('Box principal');
  await page.getByRole('button', { name: 'Cadastrar box' }).click();
  const date = futureDateInSaoPaulo(1);
  const weekdayLabel = weekdayLabels[new Date(`${date}T12:00:00Z`).getUTCDay()];
  await page.getByLabel(`${weekdayLabel} aberto`).check();
  await page.getByRole('button', { name: 'Salvar agenda' }).click();

  await page.getByLabel('Serviço do encaixe').selectOption({
    label: 'Lavagem expressa — 60 min',
  });
  await page.getByLabel('Data do encaixe').fill(date);
  await page.getByRole('button', { name: 'Consultar encaixes' }).click();
  await page
    .getByLabel('Horários para encaixe')
    .getByRole('button', { name: '08:00' })
    .click();
  await page.getByLabel('Nome do cliente do encaixe').fill('Cliente de Balcão');
  await page.getByLabel('Telefone do cliente do encaixe').fill('11988880001');
  await page.getByLabel('Placa do veículo do encaixe').fill('DEF4G56');
  await page.getByRole('button', { name: 'Registrar encaixe' }).click();

  await expect(page.getByText('Encaixe registrado.')).toBeVisible();
  const appointment = page
    .getByLabel('Agenda diária')
    .getByRole('listitem')
    .filter({ hasText: 'Cliente de Balcão' });
  await expect(appointment).toContainText('Lavagem expressa');
  await expect(appointment).toContainText('Encaixe da equipe');
  await expect(appointment).toContainText('Placa: DEF4G56');
  await appointment
    .getByRole('button', { name: 'Cancelar agendamento' })
    .click();
  await page
    .getByLabel('Horário informado do pedido (opcional)')
    .fill(`${futureDateInSaoPaulo(-1)}T06:00`);
  await page.getByRole('button', { name: 'Confirmar cancelamento' }).click();
  await expect(page.getByText('Agendamento cancelado.')).toBeVisible();
  await expect(appointment).toContainText('Cancelado');
  await expect(appointment).toContainText(/Pedido informado: .* às 06:00/);
  await expect(appointment).toContainText(
    /Última mudança: dona\.horizonte@example\.test em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/,
  );
});

const weekdayLabels = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

function futureDateInSaoPaulo(days: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  const date = new Date(
    Date.UTC(part('year'), part('month') - 1, part('day') + days),
  );
  return date.toISOString().slice(0, 10);
}

test('troca de lavação só permite salvar o contato depois de carregar o perfil correto', async ({
  page,
}) => {
  await openOwnerWithTwoCarWashes(page);
  const phone = page.getByLabel('Telefone operacional com DDD');
  const save = page.getByRole('button', {
    name: 'Salvar informações públicas',
  });
  await expect(phone).toHaveValue('5511999990001');

  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    '**/api/car-washes/lavacao-lua/public-profile',
    async (route) => {
      await pending;
      await route.continue();
    },
  );
  try {
    await page
      .getByLabel('Lavação ativa')
      .selectOption({ label: 'Lavação Lua' });
    await expect(phone).toBeDisabled();
    await expect(phone).toHaveValue('');
    await expect(save).toBeDisabled();
  } finally {
    release();
  }
  await expect(phone).toHaveValue('5521999990002');
  await phone.fill('(21) 99999-0003');
  await save.click();
  await expect(
    page.getByText('Informações públicas atualizadas.'),
  ).toBeVisible();

  await page.goto(`${baseUrl}/lavacoes/lavacao-lua`);
  await expect(page.getByText('Contato: +5521999990003')).toBeVisible();
  await page.goto(`${baseUrl}/lavacoes/lavacao-sol`);
  await expect(page.getByText('Contato: +5511999990001')).toBeVisible();
});

test('falha ao carregar outra lavação mantém o contato bloqueado até uma nova consulta', async ({
  page,
}) => {
  await openOwnerWithTwoCarWashes(page);
  const phone = page.getByLabel('Telefone operacional com DDD');
  const save = page.getByRole('button', {
    name: 'Salvar informações públicas',
  });
  await expect(phone).toHaveValue('5511999990001');
  await page.route('**/api/car-washes/lavacao-lua/public-profile', (route) =>
    route.fulfill({
      status: 503,
      json: { message: 'Contato temporariamente indisponível.' },
    }),
  );
  await page.getByLabel('Lavação ativa').selectOption({ label: 'Lavação Lua' });
  await expect(
    page.getByText('Contato temporariamente indisponível.'),
  ).toBeVisible();
  await expect(phone).toHaveValue('');
  await expect(phone).toBeDisabled();
  await expect(save).toBeDisabled();

  await page.unroute('**/api/car-washes/lavacao-lua/public-profile');
  await page.reload();
  await page.getByLabel('Lavação ativa').selectOption({ label: 'Lavação Lua' });
  await expect(phone).toHaveValue('5521999990002');
  await expect(save).toBeEnabled();
});

for (const method of ['GET', 'PATCH']) {
  test(`resposta atrasada de ${method} não substitui o contato da lavação ativa`, async ({
    page,
  }) => {
    await openOwnerWithTwoCarWashes(page);
    const phone = page.getByLabel('Telefone operacional com DDD');
    const save = page.getByRole('button', {
      name: 'Salvar informações públicas',
    });
    await expect(phone).toHaveValue('5511999990001');
    if (method === 'PATCH') {
      await page
        .getByLabel('Lavação ativa')
        .selectOption({ label: 'Lavação Lua' });
      await expect(phone).toHaveValue('5521999990002');
      await phone.fill('(21) 99999-0003');
    }

    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let responseReady!: () => void;
    const ready = new Promise<void>((resolve) => {
      responseReady = resolve;
    });
    await page.route(
      '**/api/car-washes/lavacao-lua/public-profile',
      async (route) => {
        const response = await route.fetch();
        responseReady();
        await pending;
        await route.fulfill({ response });
      },
    );
    try {
      if (method === 'GET') {
        await page
          .getByLabel('Lavação ativa')
          .selectOption({ label: 'Lavação Lua' });
      } else {
        await save.click();
      }
      await ready;
      await page
        .getByLabel('Lavação ativa')
        .selectOption({ label: 'Lavação Sol' });
      await expect(phone).toHaveValue('5511999990001');
      const delivered = page.waitForResponse(
        (response) =>
          response
            .url()
            .endsWith('/api/car-washes/lavacao-lua/public-profile') &&
          response.request().method() === method,
      );
      release();
      await (await delivered).finished();
      // Deixa o navegador processar a resposta e renderizar antes de conferir o formulário.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
      await expect(phone).toHaveValue('5511999990001');
      await save.click();
      await expect(
        page.getByText('Informações públicas atualizadas.'),
      ).toBeVisible();
    } finally {
      release();
    }
    await page.goto(`${baseUrl}/lavacoes/lavacao-sol`);
    await expect(page.getByText('Contato: +5511999990001')).toBeVisible();
    await page.goto(`${baseUrl}/lavacoes/lavacao-lua`);
    await expect(
      page.getByText(
        method === 'PATCH'
          ? 'Contato: +5521999990003'
          : 'Contato: +5521999990002',
      ),
    ).toBeVisible();
  });
}

test('proprietário convida e revoga uma funcionária pela interface', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const outputFile = join(tmpdir(), `nitivo-team-link-${randomUUID()}.txt`);
  execFileSync(
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
      env: { ...process.env, APP_URL: baseUrl },
      encoding: 'utf8',
    },
  );
  const setupLink = readFileSync(outputFile, 'utf8').trim();
  unlinkSync(outputFile);
  await page.goto(setupLink);
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Definir senha' }).click();
  await page.getByLabel('E-mail').fill('dona.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await page
    .getByLabel('E-mail da pessoa')
    .fill('funcionaria.horizonte@example.test');
  await page.getByRole('button', { name: 'Criar convite' }).click();
  const invitationUrl = await page.getByLabel('Link privado').inputValue();
  expect(invitationUrl).toContain('/accept-invitation?token=');

  await page.getByRole('button', { name: 'Sair' }).click();
  await page.goto(invitationUrl);
  await expect(
    page.getByRole('heading', { name: 'Aceite o convite' }),
  ).toBeVisible();
  await page.getByLabel('Crie sua senha').fill('Senha-ficticia-456!');
  await page.getByRole('button', { name: 'Aceitar convite' }).click();
  await page.getByLabel('E-mail').fill('funcionaria.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-456!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(
    page.getByRole('heading', { name: 'Acesso de funcionário' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Novo serviço' }),
  ).not.toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(
    page.getByRole('heading', { name: 'Acesse sua lavação' }),
  ).toBeVisible();
  await page.getByLabel('E-mail').fill('dona.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('button', { name: 'Revogar acesso' }).click();
  await expect(page.getByText('Acesso revogado.')).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(
    page.getByRole('heading', { name: 'Acesse sua lavação' }),
  ).toBeVisible();

  await page.getByLabel('E-mail').fill('funcionaria.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-456!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('E-mail ou senha inválidos')).toBeVisible();
});

test('pessoa com dois vínculos escolhe em qual lavação deseja atuar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const firstOwnerLink = provisionOwner({
    baseUrl,
    carWashName: 'Lavação Sol',
    slug: 'lavacao-sol',
    email: 'dona.comum@example.test',
  });
  const secondOwnerLink = provisionOwner({
    baseUrl,
    carWashName: 'Lavação Lua',
    slug: 'lavacao-lua',
    email: 'dona.lua@example.test',
  });

  for (const link of [firstOwnerLink, secondOwnerLink]) {
    await page.goto(link);
    await page.getByLabel('Senha').fill('Senha-ficticia-123!');
    await page.getByRole('button', { name: 'Definir senha' }).click();
  }
  await page.getByLabel('E-mail').fill('dona.lua@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByLabel('E-mail da pessoa').fill('dona.comum@example.test');
  await page.getByRole('button', { name: 'Criar convite' }).click();
  const invitationUrl = await page.getByLabel('Link privado').inputValue();
  await page.getByRole('button', { name: 'Sair' }).click();

  await page.goto(invitationUrl);
  await page.getByLabel('E-mail').fill('dona.comum@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('button', { name: 'Aceitar com esta conta' }).click();

  await page.getByLabel('Lavação ativa').selectOption({ label: 'Lavação Lua' });
  await expect(
    page.getByRole('heading', { name: 'Acesso de funcionário' }),
  ).toBeVisible();
  await page.getByLabel('Lavação ativa').selectOption({ label: 'Lavação Sol' });
  await expect(
    page.getByRole('heading', { name: 'Serviços da sua lavação' }),
  ).toBeVisible();
});

test('pessoa recupera o acesso por link privado no celular', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const setupLink = provisionOwner({
    baseUrl,
    carWashName: 'Lavação Horizonte',
    slug: 'lavacao-horizonte',
    email: 'dona.horizonte@example.test',
  });
  await page.goto(setupLink);
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Definir senha' }).click();
  await page.getByLabel('E-mail').fill('dona.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Serviços da sua lavação' }),
  ).toBeVisible();

  const recoveryLink = recoverAccess({
    baseUrl,
    email: 'dona.horizonte@example.test',
  });
  await page.goto(recoveryLink);
  await expect(
    page.getByRole('heading', { name: 'Redefina sua senha' }),
  ).toBeVisible();
  await page.getByLabel('Nova senha').fill('Nova-senha-ficticia-123!');
  await page.getByRole('button', { name: 'Redefinir senha' }).click();

  await expect(
    page.getByRole('heading', { name: 'Acesse sua lavação' }),
  ).toBeVisible();
  await page.getByLabel('E-mail').fill('dona.horizonte@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('E-mail ou senha inválidos')).toBeVisible();
  await page.getByLabel('Senha').fill('Nova-senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Serviços da sua lavação' }),
  ).toBeVisible();
});

async function openOwnerWithTwoCarWashes(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  const setupLink = provisionOwner({
    baseUrl,
    carWashName: 'Lavação Sol',
    slug: 'lavacao-sol',
    email: 'dona.comum@example.test',
  });
  // O provisionamento atual cria apenas o primeiro vínculo de proprietário.
  const client = database.client();
  await client.connect();
  try {
    await client.query(
      'UPDATE "CarWash" SET "operationalContactPhone" = $1 WHERE slug = $2',
      ['5511999990001', 'lavacao-sol'],
    );
    await client.query(
      'INSERT INTO "CarWash" (id, name, slug, "operationalContactPhone") VALUES ($1, $2, $1, $3)',
      ['lavacao-lua', 'Lavação Lua', '5521999990002'],
    );
    await client.query(
      'INSERT INTO "Membership" (id, "userId", "carWashId", role) SELECT $1, id, $2, $3 FROM "User" WHERE email = $4',
      ['proprietaria-lua', 'lavacao-lua', 'OWNER', 'dona.comum@example.test'],
    );
  } finally {
    await client.end();
  }
  await page.goto(setupLink);
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Definir senha' }).click();
  await page.getByLabel('E-mail').fill('dona.comum@example.test');
  await page.getByLabel('Senha').fill('Senha-ficticia-123!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByLabel('Lavação ativa').selectOption({ label: 'Lavação Sol' });
}

function provisionOwner(input: {
  baseUrl: string;
  carWashName: string;
  slug: string;
  email: string;
}) {
  const outputFile = join(tmpdir(), `nitivo-owner-${randomUUID()}.txt`);
  execFileSync(
    process.execPath,
    [
      '--require',
      'ts-node/register',
      'src/scripts/provision-owner.ts',
      '--car-wash-name',
      input.carWashName,
      '--slug',
      input.slug,
      '--owner-email',
      input.email,
      '--output-file',
      outputFile,
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, APP_URL: input.baseUrl },
      encoding: 'utf8',
    },
  );
  const link = readFileSync(outputFile, 'utf8').trim();
  unlinkSync(outputFile);
  return link;
}

function recoverAccess(input: { baseUrl: string; email: string }) {
  const outputFile = join(tmpdir(), `nitivo-recovery-${randomUUID()}.txt`);
  execFileSync(
    process.execPath,
    [
      '--require',
      'ts-node/register',
      'src/scripts/recover-access.ts',
      '--email',
      input.email,
      '--output-file',
      outputFile,
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, APP_URL: input.baseUrl },
      encoding: 'utf8',
    },
  );
  const link = readFileSync(outputFile, 'utf8').trim();
  unlinkSync(outputFile);
  return link;
}
