import { Injectable, NotFoundException, Dependencies } from '@nestjs/common';
import { JobsRepository } from './jobs.repository.js';

@Injectable()
@Dependencies(JobsRepository)
export class JobsService {
  constructor(jobsRepository) {
    this.jobsRepository = jobsRepository;
  }

  async create(createJobDto, ownerId) {
    return this.jobsRepository.create({
      ...createJobDto,
      ownerId,
      status: 'Draft',
    });
  }

  async findAll(userId, userProfile) {
    return this.jobsRepository.findAll(userId, userProfile);
  }

  async findOne(id) {
    const job = await this.jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID '${id}' not found`);
    }
    return job;
  }

  async update(id, updateJobDto) {
    await this.findOne(id);
    return this.jobsRepository.update(id, updateJobDto);
  }

  async remove(id) {
    await this.findOne(id);
    return this.jobsRepository.softDelete(id);
  }
}
