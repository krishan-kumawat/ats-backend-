import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 400; // Default to Bad Request for known database constraint issues
    let message = 'Database validation or constraint error';

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = 409;
        const targetFields = exception.meta?.target ? exception.meta.target.join(', ') : 'unknown';
        message = `Unique constraint failed on field(s): ${targetFields}`;
        break;
      case 'P2025': // Record not found for update/delete
        status = 404;
        message = exception.meta?.cause || 'Requested record was not found';
        break;
      case 'P2003': // Foreign key constraint violation
        status = 400;
        message = `Foreign key reference constraint failed. Ensure all referenced IDs (like departmentId, roleId, profileId, jobId, or ownerId) are valid and exist in the system.`;
        break;
      case 'P2007': // Type mismatch / driver errors (e.g. invalid UUID format)
        status = 400;
        if (exception.message && exception.message.includes('invalid input syntax for type uuid')) {
          message = 'Invalid UUID format provided for reference key';
        } else {
          message = exception.meta?.driverAdapterError?.message || 'Database type validation mismatch';
        }
        break;
      default:
        // Generic database mapping
        if (exception.message && exception.message.includes('invalid input syntax for type uuid')) {
          message = 'Invalid UUID format provided for reference key';
        } else {
          message = exception.message || 'Database error occurred';
        }
        break;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      error: status === 409 ? 'Conflict' : status === 404 ? 'Not Found' : 'Bad Request',
    });
  }
}
