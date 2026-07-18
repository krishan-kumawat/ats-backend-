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
import { ProfilesService } from './profiles.service.js';
import { CreateProfileDto, UpdateProfileDto } from './dto/create-profile.dto.js';
import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('profiles')
@Dependencies(ProfilesService)
export class ProfilesController {
  constructor(profilesService) {
    this.profilesService = profilesService;
  }

  @Post()
  @RequirePermissions('identity:profile:write')
  @ApiOperation({ summary: 'Create a new baseline permission profile' })
  @ApiResponse({ status: 201, description: 'Profile successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Profile name already exists.' })
  create(@Body() createProfileDto, @Req() request) {
    return this.profilesService.create(createProfileDto, request.user.sub);
  }

  @Get()
  @RequirePermissions('identity:profile:read')
  @ApiOperation({ summary: 'Retrieve all profiles with their permissions' })
  @ApiResponse({ status: 200, description: 'Successfully returned all profiles.' })
  findAll() {
    return this.profilesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('identity:profile:read')
  @ApiOperation({ summary: 'Get a specific profile by ID' })
  @ApiResponse({ status: 200, description: 'Successfully returned profile details.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  findOne(@Param('id') id) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('identity:profile:write')
  @ApiOperation({ summary: 'Update profile details' })
  @ApiResponse({ status: 200, description: 'Profile details updated.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  update(@Param('id') id, @Body() updateProfileDto, @Req() request) {
    return this.profilesService.update(id, updateProfileDto, request.user.sub);
  }

  @Delete(':id')
  @RequirePermissions('identity:profile:write')
  @ApiOperation({ summary: 'Soft delete a profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  remove(@Param('id') id) {
    return this.profilesService.remove(id);
  }

  @Post(':id/permissions')
  @RequirePermissions('identity:profile:write')
  @ApiOperation({ summary: 'Assign a list of permission codes to this profile' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  assignPermissions(@Param('id') id, @Body() assignPermissionsDto) {
    return this.profilesService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }
}
