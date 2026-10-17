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
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service.js';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { SystemPermGuard } from '../common/guards/system-perm.guard.js';
import { RequireSystemPerm } from '../common/decorators/require-system-perm.decorator.js';
import { CustomValidationPipe } from '../common/pipes/custom-validation.pipe.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SystemPermGuard)
@Controller('departments')
@Dependencies(DepartmentsService)
export class DepartmentsController {
  constructor(departmentsService) {
    this.departmentsService = departmentsService;
  }

  @Post()
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department successfully created.' })
  @ApiResponse({ status: 409, description: 'Department name already exists.' })
  @UsePipes(new CustomValidationPipe(CreateDepartmentDto))
  create(@Body() createDepartmentDto, @CurrentUser('sub') userId) {
    return this.departmentsService.create(createDepartmentDto, userId);
  }

  @Get()
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Retrieve all active departments' })
  @ApiResponse({ status: 200, description: 'Successfully returned all departments.' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Get details of a department by ID' })
  @ApiResponse({ status: 200, description: 'Successfully returned department details.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  findOne(@Param('id') id) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Update department details' })
  @ApiResponse({ status: 200, description: 'Department updated.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  @UsePipes(new CustomValidationPipe(UpdateDepartmentDto))
  update(@Param('id') id, @Body() updateDepartmentDto, @CurrentUser('sub') userId) {
    return this.departmentsService.update(id, updateDepartmentDto, userId);
  }

  @Delete(':id')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Soft delete a department' })
  @ApiResponse({ status: 200, description: 'Department successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  remove(@Param('id') id) {
    return this.departmentsService.remove(id);
  }
}
