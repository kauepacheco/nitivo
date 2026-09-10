import { expect, test } from '@playwright/test';
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
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test' },
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
