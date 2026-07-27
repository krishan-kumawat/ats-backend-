import { Controller, Get, Post, Body, Param, UseGuards, Dependencies } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
@Dependencies(PermissionsService)
export class PermissionsController {
  constructor(permissionsService) {
    this.permissionsService = permissionsService;
  }

  @Post()
  @RequirePermissions('identity:permission:write')
  @ApiOperation({ summary: 'Register a new permission code' })
  @ApiResponse({ status: 201, description: 'Permission registered successfully.' })
  @ApiResponse({ status: 409, description: 'Permission code already exists.' })
  create(@Body() createPermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequirePermissions('identity:permission:read')
  @ApiOperation({ summary: 'List all permission codes' })
  @ApiResponse({ status: 200, description: 'List of all system permissions returned.' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('identity:permission:read')
  @ApiOperation({ summary: 'Get details of a permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission details returned.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  findOne(@Param('id') id) {
    return this.permissionsService.findOne(id);
  }
}
