import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Dependencies,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SharingService } from './sharing.service.js';
import { ShareResourceDto, UnshareResourceDto } from './dto/share-resource.dto.js';
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

  @Post('share')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Share a resource (Job/Candidate) with a user' })
  @ApiResponse({ status: 201, description: 'Resource share rule created and access calculation task queued.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only record owner or Admin can share.' })
  share(@Body() shareResourceDto, @Req() request) {
    return this.sharingService.share(shareResourceDto, request.user.sub, request.user.profile);
  }

  @Post('unshare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke share access to a resource' })
  @ApiResponse({ status: 200, description: 'Access revoked and purge task queued.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only record owner or Admin can modify shares.' })
  unshare(@Body() unshareResourceDto, @Req() request) {
    return this.sharingService.unshare(unshareResourceDto, request.user.sub, request.user.profile);
  }

  @Get('my-access')
  @ApiOperation({ summary: 'List all resources shared with the logged-in user' })
  @ApiResponse({ status: 200, description: 'List of shared resources returned.' })
  getUserAccess(@Req() request) {
    return this.sharingService.getUserAccess(request.user.sub);
  }

  @Get('resource-access')
  @ApiOperation({ summary: 'Get list of all users and access paths for a specific resource' })
  @ApiResponse({ status: 200, description: 'Resource access summary returned.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Calling user must have access to this resource.' })
  getResourceAccess(
    @Query('resourceType') resourceType,
    @Query('resourceId') resourceId,
    @Req() request
  ) {
    return this.sharingService.getResourceAccess(
      resourceType,
      resourceId,
      request.user.sub,
      request.user.profile
    );
  }
}
