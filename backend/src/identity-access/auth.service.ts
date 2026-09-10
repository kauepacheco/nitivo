import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AccessTokenPurpose,
  MembershipRole,
  MembershipStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { SESSION_ABSOLUTE_HOURS, SESSION_IDLE_MINUTES } from './auth.constants';
import { AuthenticationThrottleService } from './authentication-throttle.service';
import { AuthenticatedSession } from './auth.types';
import { hashSecret } from './hash-secret';
import { hashPassword } from './password-hash';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly throttle: AuthenticationThrottleService,
  ) {}

  async setPassword(
    token: string,
    password: string,
    remoteAddress: string,
  ): Promise<void> {
    const now = new Date();
    const tokenHash = hashSecret(token);
    const attemptKey = hashSecret(`set-password|${remoteAddress}`);
    await this.throttle.assertAllowed(attemptKey);
    const accessToken = await this.prisma.accessToken.findUnique({
      where: { tokenHash },
    });

    if (!accessToken) {
      await this.throttle.recordFailure(attemptKey);
      throw new BadRequestException('Link inválido, expirado ou já utilizado');
    }
    if (
      accessToken.purpose !== AccessTokenPurpose.SET_PASSWORD ||
      accessToken.consumedAt ||
      accessToken.expiresAt <= now
    ) {
      await this.throttle.recordFailure(attemptKey);
      throw new BadRequestException('Link inválido, expirado ou já utilizado');
    }

    const passwordHash = await hashPassword(password);

    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.accessToken.updateMany({
        where: {
          id: accessToken.id,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException(
          'Link inválido, expirado ou já utilizado',
        );
      }
      await transaction.user.update({
        where: { id: accessToken.userId },
        data: { passwordHash },
      });
      await transaction.session.updateMany({
        where: { userId: accessToken.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });
    await this.throttle.clear(attemptKey);
  }

  async login(email: string, password: string, remoteAddress: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const attemptKey = hashSecret(`${normalizedEmail}|${remoteAddress}`);
    await this.throttle.assertAllowed(attemptKey);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          include: { carWash: true },
        },
      },
    });
    const passwordMatches =
      user?.passwordHash && (await argon2.verify(user.passwordHash, password));

    if (!user || !passwordMatches || user.memberships.length === 0) {
      await this.throttle.recordFailure(attemptKey);
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    await this.throttle.clear(attemptKey);
    const now = new Date();
    const rawSessionToken = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashSecret(rawSessionToken),
        csrfToken,
        lastSeenAt: now,
        expiresAt: addMinutes(now, SESSION_IDLE_MINUTES),
        absoluteExpiresAt: addHours(now, SESSION_ABSOLUTE_HOURS),
      },
    });

    return {
      rawSessionToken,
      expiresAt: session.absoluteExpiresAt,
      csrfToken,
      user: {
        email: user.email,
        memberships: user.memberships.map(toMembershipView),
      },
    };
  }

  async authenticate(rawSessionToken: string): Promise<AuthenticatedSession> {
    const now = new Date();
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSecret(rawSessionToken) },
      include: {
        user: {
          include: {
            memberships: {
              where: { status: MembershipStatus.ACTIVE },
              include: { carWash: true },
            },
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.absoluteExpiresAt <= now ||
      session.user.memberships.length === 0
    ) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    const expiresAt = minDate(
      addMinutes(now, SESSION_IDLE_MINUTES),
      session.absoluteExpiresAt,
    );
    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: now, expiresAt },
    });

    return {
      id: session.id,
      userId: session.userId,
      email: session.user.email,
      csrfToken: session.csrfToken,
      memberships: session.user.memberships.map(toMembershipView),
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 3_600_000);
}

function minDate(first: Date, second: Date) {
  return first < second ? first : second;
}

function toMembershipView(membership: {
  carWashId: string;
  role: MembershipRole;
  carWash: { name: string };
}) {
  return {
    carWashId: membership.carWashId,
    carWashName: membership.carWash.name,
    role: membership.role,
  };
}
