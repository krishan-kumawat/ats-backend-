import { Controller, Get, UseGuards, Dependencies } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
@Dependencies(AuditService)
export class AuditController {
  constructor(auditService) {
    this.auditService = auditService;
  }

  @Get()
  @RequirePermissions('system:audit:read')
  @ApiOperation({ summary: 'Retrieve all system audit logs' })
  @ApiResponse({ status: 200, description: 'List of audit logs returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.auditService.findAll();
  }
}
