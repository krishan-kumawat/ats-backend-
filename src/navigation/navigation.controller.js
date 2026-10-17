import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Dependencies,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NavigationService } from './navigation.service.js';
import { TabNavigationResponseDto } from './dto/tab-navigation-response.dto.js';
import { UpdateTabSettingDto } from './dto/update-tab-setting.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { SystemPermGuard } from '../common/guards/system-perm.guard.js';
import { RequireSystemPerm } from '../common/decorators/require-system-perm.decorator.js';

@ApiTags('Navigation')
@ApiBearerAuth()
@Controller()
@Dependencies(NavigationService)
export class NavigationController {
  constructor(navigationService) {
    this.navigationService = navigationService;
  }

  @Get('navigation/tabs')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve authorized navigation tabs for the current user' })
  @ApiResponse({ status: 200, type: [TabNavigationResponseDto], description: 'List of visible tabs returned.' })
  getNavigationTabs(@Req() request) {
    return this.navigationService.getUserNavigationTabs(request.user.sub);
  }

  @Patch('admin/tab-settings')
  @UseGuards(JwtAuthGuard, SystemPermGuard)
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Update tab settings for a permission set' })
  @ApiResponse({ status: 200, description: 'Tab settings updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
  updateTabSetting(@Body() updateTabSettingDto, @Req() request) {
    return this.navigationService.updateTabSetting(updateTabSettingDto, request.user.sub);
  }
}
