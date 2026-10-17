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
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service.js';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/create-candidate.dto.js';
import { AssignJobDto } from './dto/assign-job.dto.js';
import { UpdateJobLinkDto } from './dto/update-job-link.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { OlsGuard } from '../common/guards/ols.guard.js';
import { RecordSharingGuard } from '../common/guards/record-sharing.guard.js';
import { CheckOls } from '../common/decorators/check-ols.decorator.js';
import { RequireRecordAccess } from '../common/decorators/record-access.decorator.js';

@ApiTags('Candidates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OlsGuard, RecordSharingGuard)
@Controller('candidates')
@Dependencies(CandidatesService)
export class CandidatesController {
  constructor(candidatesService) {
    this.candidatesService = candidatesService;
  }

  @Post()
  @CheckOls('Candidate', 'CREATE')
  @ApiOperation({ summary: 'Create a new candidate profile' })
  @ApiResponse({ status: 201, description: 'Candidate profile successfully created.' })
  create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, expectedType: CreateCandidateDto }))
    createCandidateDto,
    @Req() request
  ) {
    return this.candidatesService.create(createCandidateDto, request.user.sub);
  }

  @Get()
  @CheckOls('Candidate', 'READ')
  @ApiOperation({ summary: 'List all candidates visible to the user' })
  @ApiResponse({ status: 200, description: 'List of candidates returned.' })
  findAll(@Req() request) {
    return this.candidatesService.findAll(request.user.sub);
  }

  @Get(':id')
  @CheckOls('Candidate', 'READ')
  @RequireRecordAccess('Candidate', 'READ', 'id')
  @ApiOperation({ summary: 'Get details of a candidate by ID' })
  @ApiResponse({ status: 200, description: 'Job details returned.' })
  @ApiResponse({ status: 403, description: 'Forbidden. No access to this candidate.' })
  @ApiResponse({ status: 404, description: 'Candidate not found.' })
  findOne(@Param('id') id) {
    return this.candidatesService.findOne(id);
  }

  @Patch(':id')
  @CheckOls('Candidate', 'EDIT')
  @RequireRecordAccess('Candidate', 'EDIT', 'id')
  @ApiOperation({ summary: 'Update candidate profile details' })
  @ApiResponse({ status: 200, description: 'Candidate updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden. No edit access.' })
  @ApiResponse({ status: 404, description: 'Candidate not found.' })
  update(
    @Param('id') id,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, expectedType: UpdateCandidateDto }))
    updateCandidateDto,
    @Req() request
  ) {
    return this.candidatesService.update(id, updateCandidateDto, request.user.sub);
  }

  @Delete(':id')
  @CheckOls('Candidate', 'DELETE')
  @RequireRecordAccess('Candidate', 'EDIT', 'id')
  @ApiOperation({ summary: 'Soft delete a candidate profile' })
  @ApiResponse({ status: 200, description: 'Candidate successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden. No delete access.' })
  @ApiResponse({ status: 404, description: 'Candidate not found.' })
  remove(@Param('id') id) {
    return this.candidatesService.remove(id);
  }

  @Post(':id/jobs')
  @CheckOls('Candidate', 'EDIT')
  @RequireRecordAccess('Candidate', 'EDIT', 'id')
  @ApiOperation({ summary: 'Link a candidate to a job opening' })
  @ApiResponse({ status: 201, description: 'Candidate linked to job successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. No edit access.' })
  @ApiResponse({ status: 404, description: 'Candidate or Job not found.' })
  linkToJob(
    @Param('id') id,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, expectedType: AssignJobDto }))
    assignJobDto,
    @Req() request
  ) {
    return this.candidatesService.linkToJob(id, assignJobDto.jobId, assignJobDto.status, request.user.sub);
  }

  @Patch(':id/jobs/:jobId')
  @CheckOls('Candidate', 'EDIT')
  @RequireRecordAccess('Candidate', 'EDIT', 'id')
  @ApiOperation({ summary: 'Update candidate job link details (status, scorecards, approvals)' })
  @ApiResponse({ status: 200, description: 'Candidate job details updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. No edit access.' })
  @ApiResponse({ status: 404, description: 'Candidate or Job not found.' })
  updateJobLink(
    @Param('id') id,
    @Param('jobId') jobId,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, expectedType: UpdateJobLinkDto }))
    updateJobLinkDto,
    @Req() request,
  ) {
    return this.candidatesService.updateJobLink(id, jobId, updateJobLinkDto, request.user.sub);
  }
}
