import { PrismaPg } from '@prisma/adapter-pg';
import {
  AccessTokenPurpose,
  MembershipStatus,
  PrismaClient,
} from '@prisma/client';
import { parseArgs } from 'node:util';
import { prepareAccessRecovery } from '../identity-access/access-recovery';
import { hashSecret } from '../identity-access/hash-secret';
import { persistWithPrivateLink } from './private-link-file';

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
  const recovery = await prepareAccessRecovery(
    {
      findByEmail: async (accountEmail) => {
        const user = await prisma.user.findUnique({
          where: { email: accountEmail },
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
        return user
          ? {
              id: user.id,
              hasPassword: user.passwordHash !== null,
              hasActiveMembership: user.memberships.length > 0,
            }
          : null;
      },
    },
    email,
  );

  const recoveryUrl = new URL(
    '/reset-password',
    process.env.APP_URL ?? 'http://127.0.0.1:3000',
  );
  recoveryUrl.searchParams.set('token', recovery.rawToken);

  await persistWithPrivateLink({
    outputFile,
    url: recoveryUrl,
    persist: () =>
      prisma.$transaction(async (transaction) => {
        await transaction.accessToken.updateMany({
          where: {
            userId: recovery.userId,
            purpose: AccessTokenPurpose.RESET_PASSWORD,
            consumedAt: null,
          },
          data: { consumedAt: recovery.createdAt },
        });
        await transaction.accessToken.create({
          data: {
            userId: recovery.userId,
            purpose: AccessTokenPurpose.RESET_PASSWORD,
            tokenHash: hashSecret(recovery.rawToken),
            expiresAt: recovery.expiresAt,
          },
        });
      }),
  });
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
