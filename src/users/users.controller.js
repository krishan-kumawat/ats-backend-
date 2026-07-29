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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto.js';
import { AssignPermissionSetsDto } from './dto/assign-permission-sets.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { SystemPermGuard } from '../common/guards/system-perm.guard.js';
import { RequireSystemPerm } from '../common/decorators/require-system-perm.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SystemPermGuard)
@Controller('users')
@Dependencies(UsersService)
export class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  @Post()
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  create(@Body() createUserDto, @Req() request) {
    return this.usersService.create(createUserDto, request.user.sub);
  }

  @Get()
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Retrieve all active users' })
  @ApiResponse({ status: 200, description: 'User list returned successfully.' })
  findAll(
    @Query("page") page,
    @Query("limit") limit,
    @Query("search") search,
    @Query("profile") profile
  ) {
    return this.usersService.findAll(page, limit, search, profile);
  }

  @Get(':id')
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Get details of a user by ID' })
  @ApiResponse({ status: 200, description: 'User details returned.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Update details of a user' })
  @ApiResponse({ status: 200, description: 'User details updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(@Param('id') id, @Body() updateUserDto, @Req() request) {
    return this.usersService.update(id, updateUserDto, request.user.sub);
  }

  @Delete(':id')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiResponse({ status: 200, description: 'User successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id) {
    return this.usersService.remove(id);
  }

  @Post(':id/permission-sets')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Assign permission sets to a user' })
  @ApiResponse({ status: 200, description: 'Permission sets assigned successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  assignPermissionSets(@Param('id') id, @Body() assignPermissionSetsDto) {
    return this.usersService.assignPermissionSets(id, assignPermissionSetsDto.permissionSetIds);
  }
}
