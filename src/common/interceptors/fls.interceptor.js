import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs/operators';
import { CHECK_OLS_KEY } from '../decorators/check-ols.decorator.js';
import { PermissionsService } from '../../permissions/permissions.service.js';

@Injectable()
@Dependencies(Reflector, PermissionsService)
export class FlsInterceptor {
  constructor(reflector, permissionsService) {
    this.reflector = reflector;
    this.permissionsService = permissionsService;
  }

  async sanitizeObject(data, objectApiName, matrix) {
    if (!data || typeof data !== 'object') return data;

    // Handle arrays recursively
    if (Array.isArray(data)) {
      const sanitizedArray = [];
      for (const item of data) {
        sanitizedArray.push(await this.sanitizeObject(item, objectApiName, matrix));
      }
      return sanitizedArray;
    }

    const sanitizedObj = {};
    const objFields = matrix.fields[objectApiName] || {};

    for (const [key, value] of Object.entries(data)) {
      // Check if this property has an FLS restriction defined
      const fieldPerm = objFields[key];

      // If FLS rule exists and allowRead is false, skip property
      if (fieldPerm && fieldPerm.allowRead === false) {
        continue;
      }

      // Recursively sanitize nested structures
      if (value && typeof value === 'object') {
        sanitizedObj[key] = await this.sanitizeObject(value, objectApiName, matrix);
      } else {
        sanitizedObj[key] = value;
      }
    }

    return sanitizedObj;
  }

  intercept(context, next) {
    const metadata = this.reflector.getAllAndOverride(CHECK_OLS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no OLS metadata is set, skip field-level security checks
    if (!metadata) {
      return next.handle();
    }

    const { objectApiName } = metadata;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    return next.handle().pipe(
      map(async (data) => {
        const matrix = await this.permissionsService.getEffectivePermissions(user.sub);
        if (!matrix || !matrix.fields) {
          return data;
        }
        return this.sanitizeObject(data, objectApiName, matrix);
      })
    );
  }
}
