import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AUTHENTICATION_MAX_FAILURES,
  AUTHENTICATION_WINDOW_MINUTES,
} from './auth.constants';

@Injectable()
export class AuthenticationThrottleService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAllowed(key: string) {
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

  async recordFailure(key: string) {
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
      const blockedUntil =
        failedAttempts >= AUTHENTICATION_MAX_FAILURES
          ? new Date(now.getTime() + AUTHENTICATION_WINDOW_MINUTES * 60_000)
          : null;
      await transaction.authenticationThrottle.upsert({
        where: { key },
        create: {
          key,
          failedAttempts,
          windowStartedAt: now,
          blockedUntil,
        },
        update: {
          failedAttempts,
          windowStartedAt: startsNewWindow ? now : current.windowStartedAt,
          blockedUntil,
        },
      });
    });
  }

  async clear(key: string) {
    await this.prisma.authenticationThrottle.deleteMany({ where: { key } });
  }
}
