import EmbeddedPostgres from 'embedded-postgres';
import { execFileSync } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { Client } from 'pg';

export interface TestDatabase {
  client(): Client;
  reset(): Promise<void>;
  stop(): Promise<void>;
}

export async function startTestDatabase(): Promise<TestDatabase> {
  const databaseDir = await mkdtemp(join(tmpdir(), 'nitivo-postgres-'));
  const port = await availablePort();
  const databaseName = 'nitivo_test';
  const user = 'postgres';
  const password = 'senha-ficticia-local';
  const postgres = new EmbeddedPostgres({
    databaseDir,
    port,
    user,
    password,
    persistent: false,
    postgresFlags: ['-c', 'timezone=UTC'],
    onLog: () => undefined,
  });

  await postgres.initialise();
  await postgres.start();
  await postgres.createDatabase(databaseName);

  const databaseUrl = `postgresql://${user}:${password}@127.0.0.1:${port}/${databaseName}`;
  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = 'test';

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  return {
    client: () => new Client({ connectionString: databaseUrl }),
    reset: async () => {
      const client = new Client({ connectionString: databaseUrl });
      await client.connect();
      try {
        await client.query(
          'TRUNCATE TABLE "Appointment", "WeeklyOpeningHour", "Box", "ServiceOffering", "Session", "AuthenticationThrottle", "EmployeeInvitation", "AccessToken", "Membership", "User", "CarWash" CASCADE',
        );
      } finally {
        await client.end();
      }
    },
    stop: () => postgres.stop(),
  };
}

export async function availablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(
          new Error('Não foi possível escolher uma porta para o PostgreSQL'),
        );
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}
