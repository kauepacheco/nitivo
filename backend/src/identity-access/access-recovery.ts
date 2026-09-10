import { randomBytes } from 'node:crypto';
import { hashSecret } from './hash-secret';

const RECOVERY_VALIDITY_HOURS = 1;

export interface RecoveryAccountStore {
  findByEmail(email: string): Promise<{
    id: string;
    hasPassword: boolean;
    hasActiveMembership: boolean;
  } | null>;
  replaceRecoveryTokenAtomically(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }): Promise<void>;
}

export async function prepareAccessRecovery(
  accounts: RecoveryAccountStore,
  email: string,
  now = new Date(),
) {
  const account = await accounts.findByEmail(email);
  if (!account?.hasPassword || !account.hasActiveMembership) {
    throw new Error('Conta ativa não encontrada');
  }

  const rawToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(
    now.getTime() + RECOVERY_VALIDITY_HOURS * 3_600_000,
  );
  return {
    rawToken,
    commit: () =>
      accounts.replaceRecoveryTokenAtomically({
        userId: account.id,
        tokenHash: hashSecret(rawToken),
        expiresAt,
        createdAt: now,
      }),
  };
}
