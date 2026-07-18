import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionSetsService } from './permission-sets.service.js';
import { CreatePermissionSetDto, UpdatePermissionSetDto } from './dto/create-permission-set.dto.js';
import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';

@ApiTags('Permission Sets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permission-sets')
@Dependencies(PermissionSetsService)
export class PermissionSetsController {
  constructor(permissionSetsService) {
    this.permissionSetsService = permissionSetsService;
  }

  @Post()
  @RequirePermissions('identity:permissionset:write')
  @ApiOperation({ summary: 'Create a new permission set' })
  @ApiResponse({ status: 201, description: 'Permission set successfully created.' })
  @ApiResponse({ status: 409, description: 'Permission set name already exists.' })
  create(@Body() createPermissionSetDto) {
    return this.permissionSetsService.create(createPermissionSetDto);
  }

  @Get()
  @RequirePermissions('identity:permissionset:read')
  @ApiOperation({ summary: 'Retrieve all active permission sets' })
  @ApiResponse({ status: 200, description: 'Successfully returned all permission sets.' })
  findAll() {
    return this.permissionSetsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('identity:permissionset:read')
  @ApiOperation({ summary: 'Get details of a specific permission set by ID' })
  @ApiResponse({ status: 200, description: 'Permission set details returned.' })
  @ApiResponse({ status: 404, description: 'Permission set not found.' })
  findOne(@Param('id') id) {
    return this.permissionSetsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('identity:permissionset:write')
  @ApiOperation({ summary: 'Update permission set details' })
  @ApiResponse({ status: 200, description: 'Permission set updated.' })
  @ApiResponse({ status: 404, description: 'Permission set not found.' })
  update(@Param('id') id, @Body() updatePermissionSetDto) {
    return this.permissionSetsService.update(id, updatePermissionSetDto);
  }

  @Delete(':id')
  @RequirePermissions('identity:permissionset:write')
  @ApiOperation({ summary: 'Soft delete a permission set' })
  @ApiResponse({ status: 200, description: 'Permission set successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Permission set not found.' })
  remove(@Param('id') id) {
    return this.permissionSetsService.remove(id);
  }

  @Post(':id/permissions')
  @RequirePermissions('identity:permissionset:write')
  @ApiOperation({ summary: 'Assign atomic permissions to a permission set' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully.' })
  @ApiResponse({ status: 404, description: 'Permission set not found.' })
  assignPermissions(@Param('id') id, @Body() assignPermissionsDto) {
    return this.permissionSetsService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }
}
