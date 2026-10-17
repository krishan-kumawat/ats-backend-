import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
export class AuditFieldsInterceptor {
  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;

    if (user && request.body && typeof request.body === 'object') {
      const body = request.body;

      if (method === 'POST') {
        body.createdById = user.sub;
        body.created_by_id = user.sub;
        body.lastModifiedById = user.sub;
        body.last_modified_by_id = user.sub;
      } else if (['PATCH', 'PUT'].includes(method)) {
        body.lastModifiedById = user.sub;
        body.last_modified_by_id = user.sub;
      }
    }

    return next.handle();
  }
}
