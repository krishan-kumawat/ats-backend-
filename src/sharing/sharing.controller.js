import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  Dependencies,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SharingService } from './sharing.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { SystemPermGuard } from '../common/guards/system-perm.guard.js';
import { RequireSystemPerm } from '../common/decorators/require-system-perm.decorator.js';
import { UpdateOwdDto } from './dto/update-owd.dto.js';

@ApiTags('Sharing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sharing')
@Dependencies(SharingService)
export class SharingController {
  constructor(sharingService) {
    this.sharingService = sharingService;
  }

  @Get('collaborators')
  @ApiOperation({ summary: 'Get collaborators for a record' })
  @ApiResponse({ status: 200, description: 'Successfully returned collaborators.' })
  getCollaborators(@Query('recordId') recordId, @Query('objectType') objectType) {
    return this.sharingService.getCollaborators(recordId, objectType);
  }

  @Post('share')
  @ApiOperation({ summary: 'Manually share a record with a target user' })
  @ApiResponse({ status: 201, description: 'Record shared successfully.' })
  addManualShare(
    @Body() body,
    @Req() request,
  ) {
    return this.sharingService.addManualShare(
      body.recordId,
      body.objectType,
      body.targetUserId,
      body.accessLevel,
      request.user.sub,
    );
  }

  @Delete('share')
  @ApiOperation({ summary: 'Revoke manual sharing of a record' })
  @ApiResponse({ status: 200, description: 'Sharing revoked successfully.' })
  removeManualShare(
    @Query('recordId') recordId,
    @Query('objectType') objectType,
    @Query('targetUserId') targetUserId,
    @Req() request,
  ) {
    return this.sharingService.removeManualShare(recordId, objectType, targetUserId, request.user.sub);
  }

  @Get('record-access')
  @ApiOperation({ summary: 'Calculate dynamic record-level action access for the current user' })
  @ApiResponse({ status: 200, description: 'Successfully evaluated access levels.' })
  getRecordAccess(
    @Query('recordId') recordId,
    @Query('objectType') objectType,
    @Req() request,
  ) {
    return this.sharingService.getRecordAccess(recordId, objectType, request.user.sub);
  }

  @Get('owd')
  @ApiOperation({ summary: 'Get Org-Wide Defaults (OWD) settings for all objects' })
  @ApiResponse({ status: 200, description: 'Successfully returned OWD settings.' })
  getOrgWideDefaults() {
    return this.sharingService.getOrgWideDefaults();
  }

  @Put('owd')
  @UseGuards(SystemPermGuard)
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Update Org-Wide Default (OWD) settings for an object' })
  @ApiResponse({ status: 200, description: 'OWD updated and sharing recalculations triggered.' })
  @ApiResponse({ status: 403, description: 'Forbidden. ModifyAllData permission required.' })
  updateOrgWideDefault(@Body() updateOwdDto, @Req() request) {
    return this.sharingService.updateOrgWideDefault(updateOwdDto, request.user.sub);
  }
}
