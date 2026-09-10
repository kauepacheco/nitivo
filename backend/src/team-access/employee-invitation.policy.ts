export function hasMembershipThatBlocksInvitation(
  memberships: Array<{
    role: 'OWNER' | 'EMPLOYEE';
    status: 'ACTIVE' | 'REVOKED';
  }>,
) {
  return memberships.some(
    (membership) =>
      membership.status === 'ACTIVE' || membership.role === 'OWNER',
  );
}

export function invitationCanBeUsed(
  invitation: { consumedAt: Date | null; expiresAt: Date },
  now: Date,
) {
  return !invitation.consumedAt && invitation.expiresAt > now;
}

export function invitationMatchesIdentity(
  invitation: { email: string; invitedUserId: string | null },
  identity: { email: string; userId: string },
) {
  return (
    invitation.email === identity.email &&
    (!invitation.invitedUserId || invitation.invitedUserId === identity.userId)
  );
}
