import {
  Controller,
  Get,
  Post,
  Put,
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
import { SystemPermGuard } from '../common/guards/system-perm.guard.js';
import { RequireSystemPerm } from '../common/decorators/require-system-perm.decorator.js';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SystemPermGuard)
@Controller('profiles')
@Dependencies(ProfilesService)
export class ProfilesController {
  constructor(profilesService) {
    this.profilesService = profilesService;
  }

  @Post()
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Create a new baseline permission profile' })
  @ApiResponse({ status: 201, description: 'Profile successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Profile name already exists.' })
  create(@Body() createProfileDto, @Req() request) {
    return this.profilesService.create(createProfileDto, request.user.sub);
  }

  @Get()
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Retrieve all profiles with their permissions' })
  @ApiResponse({ status: 200, description: 'Successfully returned all profiles.' })
  findAll() {
    return this.profilesService.findAll();
  }

  @Get(':id')
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Get a specific profile by ID' })
  @ApiResponse({ status: 200, description: 'Successfully returned profile details.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  findOne(@Param('id') id) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Update profile details' })
  @ApiResponse({ status: 200, description: 'Profile details updated.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  update(@Param('id') id, @Body() updateProfileDto, @Req() request) {
    return this.profilesService.update(id, updateProfileDto, request.user.sub);
  }

  @Delete(':id')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Soft delete a profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  remove(@Param('id') id) {
    return this.profilesService.remove(id);
  }

  @Post(':id/clone')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Clone a profile and all its object/field/system permissions' })
  @ApiResponse({ status: 201, description: 'Profile cloned successfully.' })
  @ApiResponse({ status: 404, description: 'Source profile not found.' })
  clone(@Param('id') id, @Body() createProfileDto, @Req() request) {
    return this.profilesService.cloneProfile(id, createProfileDto, request.user.sub);
  }

  @Post(':id/permissions')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Assign a list of permission codes to this profile' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  assignPermissions(@Param('id') id, @Body() assignPermissionsDto) {
    return this.profilesService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }

  @Get(':id/security-settings')
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Get all OLS, FLS, and System permissions for a profile' })
  @ApiResponse({ status: 200, description: 'Return all OLS, FLS, and System settings.' })
  getSecuritySettings(@Param('id') id) {
    return this.profilesService.getSecuritySettings(id);
  }

  @Put(':id/security-settings')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Update all OLS, FLS, and System permissions for a profile' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully.' })
  updateSecuritySettings(@Param('id') id, @Body() body, @Req() request) {
    return this.profilesService.updateSecuritySettings(id, body, request.user.sub);
  }
}
