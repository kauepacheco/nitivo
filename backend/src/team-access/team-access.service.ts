import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole, MembershipStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import {
  AUTHENTICATION_MAX_FAILURES,
  AUTHENTICATION_WINDOW_MINUTES,
} from '../identity-access/auth.constants';
import { hashPassword } from '../identity-access/password-hash';
import { hashSecret } from '../identity-access/hash-secret';

const INVITATION_VALIDITY_HOURS = 24;
const INVALID_INVITATION = 'Convite inválido, expirado ou já utilizado';

@Injectable()
export class TeamAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(carWashId: string, invitedByUserId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const invitedUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { memberships: { where: { carWashId } } },
    });
    if (
      invitedUser?.memberships.some(
        (membership) =>
          membership.status === MembershipStatus.ACTIVE ||
          membership.role === MembershipRole.OWNER,
      )
    ) {
      throw new ConflictException(
        'A pessoa já possui vínculo com esta lavação',
      );
    }

    const now = new Date();
    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      now.getTime() + INVITATION_VALIDITY_HOURS * 3_600_000,
    );
    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.employeeInvitation.updateMany({
          where: { carWashId, email: normalizedEmail, consumedAt: null },
          data: { consumedAt: now },
        });
        await transaction.employeeInvitation.create({
          data: {
            carWashId,
            email: normalizedEmail,
            invitedUserId: invitedUser?.id,
            invitedByUserId,
            tokenHash: hashSecret(rawToken),
            expiresAt,
          },
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Outro convite foi criado ao mesmo tempo. Tente novamente',
        );
      }
      throw error;
    }

    const invitationUrl = new URL(
      '/accept-invitation',
      process.env.APP_URL ?? 'http://127.0.0.1:3000',
    );
    invitationUrl.searchParams.set('token', rawToken);
    return {
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      invitationUrl: invitationUrl.toString(),
    };
  }

  async inspect(rawToken: string, remoteAddress: string) {
    const invitation = await this.validInvitation(rawToken, remoteAddress);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });
    return {
      carWashName: invitation.carWash.name,
      email: invitation.email,
      existingAccount: Boolean(existingUser),
    };
  }

  async acceptNew(rawToken: string, password: string, remoteAddress: string) {
    const invitation = await this.validInvitation(rawToken, remoteAddress);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('Entre na conta existente para aceitar');
    }
    const passwordHash = await hashPassword(password);
    const now = new Date();
    try {
      await this.prisma.$transaction(async (transaction) => {
        await this.consumeInvitation(transaction, invitation.id, now);
        const user = await transaction.user.create({
          data: { email: invitation.email, passwordHash },
        });
        await transaction.membership.create({
          data: {
            userId: user.id,
            carWashId: invitation.carWashId,
            role: MembershipRole.EMPLOYEE,
          },
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Entre na conta existente para aceitar');
      }
      throw error;
    }
  }

  async acceptExisting(
    rawToken: string,
    userId: string,
    email: string,
    remoteAddress: string,
  ) {
    const invitation = await this.validInvitation(rawToken, remoteAddress);
    if (
      invitation.email !== email ||
      (invitation.invitedUserId && invitation.invitedUserId !== userId)
    ) {
      throw new NotFoundException();
    }
    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      await this.consumeInvitation(transaction, invitation.id, now);
      await transaction.membership.upsert({
        where: {
          userId_carWashId: { userId, carWashId: invitation.carWashId },
        },
        create: {
          userId,
          carWashId: invitation.carWashId,
          role: MembershipRole.EMPLOYEE,
        },
        update: {
          role: MembershipRole.EMPLOYEE,
          status: MembershipStatus.ACTIVE,
        },
      });
    });
  }

  async list(carWashId: string) {
    const now = new Date();
    const [members, invitations] = await Promise.all([
      this.prisma.membership.findMany({
        where: {
          carWashId,
          role: MembershipRole.EMPLOYEE,
          status: MembershipStatus.ACTIVE,
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, status: true, user: { select: { email: true } } },
      }),
      this.prisma.employeeInvitation.findMany({
        where: { carWashId, consumedAt: null, expiresAt: { gt: now } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, email: true, expiresAt: true },
      }),
    ]);
    return {
      members: members.map((membership) => ({
        id: membership.id,
        email: membership.user.email,
        status: membership.status,
      })),
      invitations,
    };
  }

  async revoke(carWashId: string, membershipId: string) {
    const revoked = await this.prisma.membership.updateMany({
      where: {
        id: membershipId,
        carWashId,
        role: MembershipRole.EMPLOYEE,
        status: MembershipStatus.ACTIVE,
      },
      data: { status: MembershipStatus.REVOKED },
    });
    if (revoked.count !== 1) {
      throw new NotFoundException();
    }
  }

  private async validInvitation(rawToken: string, remoteAddress: string) {
    const attemptKey = hashSecret(`employee-invitation|${remoteAddress}`);
    await this.assertInvitationAttemptAllowed(attemptKey);
    if (!rawToken) {
      await this.recordInvitationFailure(attemptKey);
      throw new BadRequestException(INVALID_INVITATION);
    }
    const invitation = await this.prisma.employeeInvitation.findUnique({
      where: { tokenHash: hashSecret(rawToken) },
      include: { carWash: { select: { name: true } } },
    });
    if (
      !invitation ||
      invitation.consumedAt ||
      invitation.expiresAt <= new Date()
    ) {
      await this.recordInvitationFailure(attemptKey);
      throw new BadRequestException(INVALID_INVITATION);
    }
    await this.prisma.authenticationThrottle.deleteMany({
      where: { key: attemptKey },
    });
    return invitation;
  }

  private async assertInvitationAttemptAllowed(key: string) {
    const attempt = await this.prisma.authenticationThrottle.findUnique({
      where: { key },
    });
    if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
      throw new HttpException(
        'Muitas tentativas. Tente novamente mais tarde',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordInvitationFailure(key: string) {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - AUTHENTICATION_WINDOW_MINUTES * 60_000,
    );
    await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.authenticationThrottle.findUnique({
        where: { key },
      });
      const startsNewWindow = !current || current.windowStartedAt < windowStart;
      const failedAttempts = startsNewWindow ? 1 : current.failedAttempts + 1;
      await transaction.authenticationThrottle.upsert({
        where: { key },
        create: {
          key,
          failedAttempts,
          windowStartedAt: now,
          blockedUntil:
            failedAttempts >= AUTHENTICATION_MAX_FAILURES
              ? new Date(now.getTime() + AUTHENTICATION_WINDOW_MINUTES * 60_000)
              : null,
        },
        update: {
          failedAttempts,
          windowStartedAt: startsNewWindow ? now : current.windowStartedAt,
          blockedUntil:
            failedAttempts >= AUTHENTICATION_MAX_FAILURES
              ? new Date(now.getTime() + AUTHENTICATION_WINDOW_MINUTES * 60_000)
              : null,
        },
      });
    });
  }

  private async consumeInvitation(
    transaction: Prisma.TransactionClient,
    invitationId: string,
    now: Date,
  ) {
    const consumed = await transaction.employeeInvitation.updateMany({
      where: { id: invitationId, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (consumed.count !== 1) {
      throw new BadRequestException(INVALID_INVITATION);
    }
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
