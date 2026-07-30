import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service.js';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { OlsGuard } from '../common/guards/ols.guard.js';
import { RecordSharingGuard } from '../common/guards/record-sharing.guard.js';
import { CheckOls } from '../common/decorators/check-ols.decorator.js';
import { RequireRecordAccess } from '../common/decorators/record-access.decorator.js';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OlsGuard, RecordSharingGuard)
@Controller('jobs')
@Dependencies(JobsService)
export class JobsController {
  constructor(jobsService) {
    this.jobsService = jobsService;
  }

  @Post()
  @CheckOls('Job', 'CREATE')
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job successfully created.' })
  create(@Body() createJobDto, @Req() request) {
    return this.jobsService.create(createJobDto, request.user.sub);
  }

  @Get()
  @CheckOls('Job', 'READ')
  @ApiOperation({ summary: 'List all jobs visible to the user' })
  @ApiResponse({ status: 200, description: 'List of jobs returned.' })
  findAll(@Req() request) {
    return this.jobsService.findAll(request.user.sub);
  }

  @Get(':id')
  @CheckOls('Job', 'READ')
  @RequireRecordAccess('Job', 'READ', 'id')
  @ApiOperation({ summary: 'Get details of a job by ID' })
  @ApiResponse({ status: 200, description: 'Job details returned.' })
  @ApiResponse({ status: 403, description: 'Forbidden. No access to this job.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  findOne(@Param('id') id) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @CheckOls('Job', 'EDIT')
  @RequireRecordAccess('Job', 'EDIT', 'id')
  @ApiOperation({ summary: 'Update job details' })
  @ApiResponse({ status: 200, description: 'Job updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden. No edit access.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  update(@Param('id') id, @Body() updateJobDto, @Req() request) {
    return this.jobsService.update(id, updateJobDto, request.user.sub);
  }

  @Delete(':id')
  @CheckOls('Job', 'DELETE')
  @RequireRecordAccess('Job', 'EDIT', 'id')
  @ApiOperation({ summary: 'Soft delete a job' })
  @ApiResponse({ status: 200, description: 'Job deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden. No delete access.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  remove(@Param('id') id) {
    return this.jobsService.remove(id);
  }
}
