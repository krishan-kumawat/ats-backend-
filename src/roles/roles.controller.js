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
import { RolesService } from './roles.service.js';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
@Dependencies(RolesService)
export class RolesController {
  constructor(rolesService) {
    this.rolesService = rolesService;
  }

  @Post()
  @RequirePermissions('identity:role:write')
  @ApiOperation({ summary: 'Create a new structural role for hierarchy' })
  @ApiResponse({ status: 201, description: 'Role successfully created.' })
  @ApiResponse({ status: 409, description: 'Role name already exists.' })
  create(@Body() createRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions('identity:role:read')
  @ApiOperation({ summary: 'Retrieve all roles in hierarchy' })
  @ApiResponse({ status: 200, description: 'Successfully returned all roles.' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('identity:role:read')
  @ApiOperation({ summary: 'Get a specific role by ID' })
  @ApiResponse({ status: 200, description: 'Successfully returned role details.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  findOne(@Param('id') id) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('identity:role:write')
  @ApiOperation({ summary: 'Update role details' })
  @ApiResponse({ status: 200, description: 'Role details updated.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  update(@Param('id') id, @Body() updateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('identity:role:write')
  @ApiOperation({ summary: 'Soft delete a role' })
  @ApiResponse({ status: 200, description: 'Role successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  remove(@Param('id') id) {
    return this.rolesService.remove(id);
  }
}
