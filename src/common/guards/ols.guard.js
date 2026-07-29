import { Injectable, Dependencies, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_OLS_KEY } from '../decorators/check-ols.decorator.js';
import { PermissionsService } from '../../permissions/permissions.service.js';

@Injectable()
@Dependencies(Reflector, PermissionsService)
export class OlsGuard {
  constructor(reflector, permissionsService) {
    this.reflector = reflector;
    this.permissionsService = permissionsService;
  }

  async canActivate(context) {
    const metadata = this.reflector.getAllAndOverride(CHECK_OLS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata) {
      return true;
    }

    const { objectApiName, action } = metadata;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Forbidden: User is not authenticated');
    }

    const matrix = await this.permissionsService.getEffectivePermissions(user.sub);
    if (!matrix || !matrix.objects) {
      throw new ForbiddenException('Forbidden: Insufficient Object-Level Security (OLS) permissions');
    }

    const objPerms = matrix.objects[objectApiName];
    if (!objPerms) {
      throw new ForbiddenException(`Forbidden: No OLS permissions defined for object '${objectApiName}'`);
    }

    let isAllowed = false;
    const normAction = action.toLowerCase();

    if (normAction === 'read') {
      isAllowed = objPerms.allowRead || objPerms.viewAllData || objPerms.modifyAllData;
    } else if (normAction === 'create') {
      isAllowed = objPerms.allowCreate || objPerms.modifyAllData;
    } else if (normAction === 'edit') {
      isAllowed = objPerms.allowEdit || objPerms.modifyAllData;
    } else if (normAction === 'delete') {
      isAllowed = objPerms.allowDelete || objPerms.modifyAllData;
    }

    if (!isAllowed) {
      throw new ForbiddenException(
        `Forbidden: Insufficient Object-Level Security (OLS) to perform '${action}' on object '${objectApiName}'`
      );
    }

    return true;
  }
}
