import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { csrfSync } from 'csrf-sync';
import { AuthenticatedRequest } from './auth.types';

const { isRequestValid } = csrfSync({
  getTokenFromState: (request) =>
    (request as AuthenticatedRequest).authSession?.csrfToken,
  storeTokenInState: () => undefined,
});

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!isRequestValid(request)) {
      throw new ForbiddenException('Token CSRF inválido');
    }
    return true;
  }
}
