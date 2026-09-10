import { randomBytes } from 'node:crypto';

const RECOVERY_VALIDITY_HOURS = 1;

export interface RecoveryAccountLookup {
  findByEmail(email: string): Promise<{
    id: string;
    hasPassword: boolean;
    hasActiveMembership: boolean;
  } | null>;
}

export async function prepareAccessRecovery(
  accounts: RecoveryAccountLookup,
  email: string,
  now = new Date(),
) {
  const account = await accounts.findByEmail(email);
  if (!account?.hasPassword || !account.hasActiveMembership) {
    throw new Error('Conta ativa não encontrada');
  }

  return {
    userId: account.id,
    rawToken: randomBytes(32).toString('base64url'),
    expiresAt: new Date(now.getTime() + RECOVERY_VALIDITY_HOURS * 3_600_000),
    createdAt: now,
  };
}
