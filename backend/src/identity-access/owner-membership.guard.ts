import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class OwnerMembershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const carWashId = request.params.carWashId;
    const membership = request.authSession?.memberships.find(
      (candidate) => candidate.carWashId === carWashId,
    );
    if (!membership || membership.role !== 'OWNER') {
      throw new NotFoundException('Lavação não encontrada');
    }
    return true;
  }
}
