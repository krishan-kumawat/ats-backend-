import {
  Controller,
  Get,
  Post,
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
  ) {
    return this.sharingService.removeManualShare(recordId, objectType, targetUserId);
  }
}
