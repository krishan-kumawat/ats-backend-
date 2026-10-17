import { Injectable, Dependencies, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_OLS_KEY } from '../decorators/check-ols.decorator.js';
import { PermissionsService } from '../../permissions/permissions.service.js';

@Injectable()
@Dependencies(Reflector, PermissionsService)
export class FlsValidationInterceptor {
  constructor(reflector, permissionsService) {
    this.reflector = reflector;
    this.permissionsService = permissionsService;
  }

  async intercept(context, next) {
    const metadata = this.reflector.getAllAndOverride(CHECK_OLS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata) {
      return next.handle();
    }

    const { objectApiName } = metadata;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;

    // We only validate FLS for modifications (POST, PATCH, PUT)
    if (!user || !['POST', 'PATCH', 'PUT'].includes(method)) {
      return next.handle();
    }

    const body = request.body;
    if (body && typeof body === 'object') {
      const matrix = await this.permissionsService.getEffectivePermissions(user.sub);
      if (matrix && matrix.fields) {
        const objFields = matrix.fields[objectApiName] || {};

        for (const key of Object.keys(body)) {
          const fieldPerm = objFields[key];
          
          // If FLS rule exists and allowEdit is false, block save
          if (fieldPerm && fieldPerm.allowEdit === false) {
            throw new ForbiddenException(
              `Forbidden: Insufficient Field-Level Security (FLS) to edit field '${key}' on object '${objectApiName}'`
            );
          }
        }
      }
    }

    return next.handle();
  }
}
