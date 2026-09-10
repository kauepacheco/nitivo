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

test('proprietário ativa o acesso e cadastra seu primeiro serviço no celular', async ({
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
  await page.getByLabel('Nome').fill('Lavagem completa');
  await page.getByLabel('Preço (R$)').fill('75.00');
  await page.getByLabel('Duração (min)').fill('90');
  await page.getByRole('button', { name: 'Cadastrar serviço' }).click();

  await expect(page.getByText('Serviço cadastrado.')).toBeVisible();
  await expect(page.getByText('Lavagem completa')).toBeVisible();
  await expect(page.getByText('90 min · Ativo')).toBeVisible();
  await expect(page.getByText('R$ 75,00')).toBeVisible();
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

  await page.getByLabel('Nome').fill('Lavagem completa');
  await page.getByLabel('Preço (R$)').fill('75.00');
  await page.getByLabel('Duração (min)').fill('90');
  await page.getByRole('button', { name: 'Cadastrar serviço' }).click();
  await page.getByLabel('Nome').fill('Serviço inativo');
  await page.getByLabel('Preço (R$)').fill('10.00');
  await page.getByLabel('Duração (min)').fill('15');
  await page.getByLabel('Serviço ativo').uncheck();
  await page.getByRole('button', { name: 'Cadastrar serviço' }).click();

  await page.goto(`${baseUrl}/lavacoes/lavacao-horizonte`);
  await expect(
    page.getByRole('heading', { name: 'Lavação Horizonte' }),
  ).toBeVisible();
  await expect(page.getByText('Lavagem completa')).toBeVisible();
  await expect(page.getByText('90 min')).toBeVisible();
  await expect(page.getByText('R$ 75,00')).toBeVisible();
  await expect(page.getByText('Contato: +5511999990001')).toBeVisible();
  await expect(page.getByText('Serviço inativo')).not.toBeVisible();
});

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
