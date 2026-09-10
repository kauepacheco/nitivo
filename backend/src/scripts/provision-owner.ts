import { PrismaPg } from '@prisma/adapter-pg';
import {
  AccessTokenPurpose,
  MembershipRole,
  PrismaClient,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { hashSecret } from '../identity-access/hash-secret';
import { persistWithPrivateLink } from './private-link-file';

const { values } = parseArgs({
  options: {
    'car-wash-name': { type: 'string' },
    slug: { type: 'string' },
    'owner-email': { type: 'string' },
    'output-file': { type: 'string' },
  },
});

const carWashName = required(values['car-wash-name'], '--car-wash-name').trim();
const slug = required(values.slug, '--slug').trim().toLowerCase();
const ownerEmail = required(values['owner-email'], '--owner-email')
  .trim()
  .toLowerCase();
const databaseUrl = required(process.env.DATABASE_URL, 'DATABASE_URL');
const outputFile = required(values['output-file'], '--output-file');
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error(
    'O slug deve conter apenas letras minúsculas, números e hífens',
  );
}
if (!ownerEmail.includes('@')) {
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
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashSecret(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 3_600_000);
  const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:3000';
  const setupUrl = new URL('/set-password', appUrl);
  setupUrl.searchParams.set('token', rawToken);

  await persistWithPrivateLink({
    outputFile,
    url: setupUrl,
    persist: () =>
      prisma.$transaction(async (transaction) => {
        const carWash = await transaction.carWash.create({
          data: { name: carWashName, slug },
        });
        const user = await transaction.user.create({
          data: { email: ownerEmail },
        });
        await transaction.membership.create({
          data: {
            userId: user.id,
            carWashId: carWash.id,
            role: MembershipRole.OWNER,
          },
        });
        await transaction.accessToken.create({
          data: {
            userId: user.id,
            purpose: AccessTokenPurpose.SET_PASSWORD,
            tokenHash,
            expiresAt,
          },
        });
      }),
  });
  process.stdout.write('Link privado gravado no arquivo indicado.\n');
}

void main()
  .catch(() => {
    process.stderr.write(
      'Não foi possível provisionar. Confira os dados e se a lavação ou pessoa já existem.\n',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
