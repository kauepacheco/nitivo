import { MembershipRole } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedSession {
  id: string;
  userId: string;
  email: string;
  csrfToken: string;
  memberships: Array<{
    carWashId: string;
    carWashName: string;
    role: MembershipRole;
  }>;
}

export interface AuthenticatedRequest extends Request {
  authSession?: AuthenticatedSession;
}
