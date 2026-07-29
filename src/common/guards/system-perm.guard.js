import { Injectable, Dependencies, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SYSTEM_PERM_KEY } from '../decorators/require-system-perm.decorator.js';
import { PermissionsService } from '../../permissions/permissions.service.js';

@Injectable()
@Dependencies(Reflector, PermissionsService)
export class SystemPermGuard {
  constructor(reflector, permissionsService) {
    this.reflector = reflector;
    this.permissionsService = permissionsService;
  }

  async canActivate(context) {
    const requiredPermKey = this.reflector.getAllAndOverride(SYSTEM_PERM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Forbidden: User is not authenticated');
    }

    const matrix = await this.permissionsService.getEffectivePermissions(user.sub);
    if (!matrix || !matrix.system || matrix.system[requiredPermKey] !== true) {
      throw new ForbiddenException(
        `Forbidden: Insufficient System Permissions (Required: '${requiredPermKey}')`
      );
    }

    return true;
  }
}
