import { PrismaPg } from '@prisma/adapter-pg';
import {
  AccessTokenPurpose,
  MembershipStatus,
  PrismaClient,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { hashSecret } from '../identity-access/hash-secret';

const RECOVERY_VALIDITY_HOURS = 1;

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    'output-file': { type: 'string' },
  },
});

const email = required(values.email, '--email').trim().toLowerCase();
const databaseUrl = required(process.env.DATABASE_URL, 'DATABASE_URL');
const outputFile = required(values['output-file'], '--output-file');
if (!email.includes('@')) {
  throw new Error('Informe um e-mail válido');
}

const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Informe ${name}`);
  }
  return value;
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!user?.passwordHash || user.memberships.length === 0) {
    throw new Error('Conta ativa não encontrada');
  }

  const now = new Date();
  const rawToken = randomBytes(32).toString('base64url');
  const recoveryUrl = new URL(
    '/reset-password',
    process.env.APP_URL ?? 'http://127.0.0.1:3000',
  );
  recoveryUrl.searchParams.set('token', rawToken);

  await mkdir(dirname(outputFile), { recursive: true, mode: 0o700 });
  await writeFile(outputFile, `${recoveryUrl.toString()}\n`, {
    encoding: 'utf8',
    mode: 0o600,
    flag: 'wx',
  });

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.accessToken.updateMany({
        where: {
          userId: user.id,
          purpose: AccessTokenPurpose.RESET_PASSWORD,
          consumedAt: null,
        },
        data: { consumedAt: now },
      });
      await transaction.accessToken.create({
        data: {
          userId: user.id,
          purpose: AccessTokenPurpose.RESET_PASSWORD,
          tokenHash: hashSecret(rawToken),
          expiresAt: new Date(
            now.getTime() + RECOVERY_VALIDITY_HOURS * 3_600_000,
          ),
        },
      });
    });
  } catch (error) {
    await unlink(outputFile).catch(() => undefined);
    throw error;
  }
  process.stdout.write('Link privado gravado no arquivo indicado.\n');
}

void main()
  .catch(() => {
    process.stderr.write(
      'Não foi possível criar o link. Confira a conta ativa e o arquivo de saída.\n',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
