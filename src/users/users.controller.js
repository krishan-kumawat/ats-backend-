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
import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto.js';
import { AssignPermissionSetsDto } from './dto/assign-permission-sets.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
@Dependencies(UsersService)
export class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  @Post()
  @RequirePermissions('identity:user:write')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  create(@Body() createUserDto, @Req() request) {
    return this.usersService.create(createUserDto, request.user.sub);
  }

  @Get()
  @RequirePermissions('identity:user:read')
  @ApiOperation({ summary: 'Retrieve all active users' })
  @ApiResponse({ status: 200, description: 'User list returned successfully.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('identity:user:read')
  @ApiOperation({ summary: 'Get details of a user by ID' })
  @ApiResponse({ status: 200, description: 'User details returned.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('identity:user:write')
  @ApiOperation({ summary: 'Update details of a user' })
  @ApiResponse({ status: 200, description: 'User details updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(@Param('id') id, @Body() updateUserDto, @Req() request) {
    return this.usersService.update(id, updateUserDto, request.user.sub);
  }

  @Delete(':id')
  @RequirePermissions('identity:user:write')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiResponse({ status: 200, description: 'User successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id) {
    return this.usersService.remove(id);
  }

  @Post(':id/permission-sets')
  @RequirePermissions('identity:user:write')
  @ApiOperation({ summary: 'Assign permission sets to a user' })
  @ApiResponse({ status: 200, description: 'Permission sets assigned successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  assignPermissionSets(@Param('id') id, @Body() assignPermissionSetsDto) {
    return this.usersService.assignPermissionSets(id, assignPermissionSetsDto.permissionSetIds);
  }
}
