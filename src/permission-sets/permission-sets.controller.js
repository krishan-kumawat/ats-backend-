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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionSetsService } from './permission-sets.service.js';
import { CreatePermissionSetDto, UpdatePermissionSetDto } from './dto/create-permission-set.dto.js';
import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { SystemPermGuard } from '../common/guards/system-perm.guard.js';
import { RequireSystemPerm } from '../common/decorators/require-system-perm.decorator.js';

@ApiTags('Permission Sets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SystemPermGuard)
@Controller('permission-sets')
@Dependencies(PermissionSetsService)
export class PermissionSetsController {
  constructor(permissionSetsService) {
    this.permissionSetsService = permissionSetsService;
  }

  @Post()
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Create a new permission set' })
  @ApiResponse({ status: 201, description: 'Permission set successfully created.' })
  @ApiResponse({ status: 409, description: 'Permission set name already exists.' })
  create(@Body() createPermissionSetDto, @Req() request) {
    return this.permissionSetsService.create(createPermissionSetDto, request.user.sub);
  }

  @Get()
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Retrieve all active permission sets' })
  @ApiResponse({ status: 200, description: 'Successfully returned all permission sets.' })
  findAll() {
    return this.permissionSetsService.findAll();
  }

  @Get(':id')
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Get details of a specific permission set by ID' })
  @ApiResponse({ status: 200, description: 'Permission set details returned.' })
  @ApiResponse({ status: 404, description: 'Permission set not found.' })
  findOne(@Param('id') id) {
    return this.permissionSetsService.findOne(id);
  }

  @Patch(':id')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Update permission set details' })
  @ApiResponse({ status: 200, description: 'Permission set updated.' })
  @ApiResponse({ status: 404, description: 'Permission set not found.' })
  update(@Param('id') id, @Body() updatePermissionSetDto, @Req() request) {
    return this.permissionSetsService.update(id, updatePermissionSetDto, request.user.sub);
  }

  @Delete(':id')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Soft delete a permission set' })
  @ApiResponse({ status: 200, description: 'Permission set successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Permission set not found.' })
  remove(@Param('id') id) {
    return this.permissionSetsService.remove(id);
  }

  @Post(':id/permissions')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Assign atomic permissions to a permission set' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully.' })
  @ApiResponse({ status: 404, description: 'Permission set not found.' })
  assignPermissions(@Param('id') id, @Body() assignPermissionsDto) {
    return this.permissionSetsService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }
}
