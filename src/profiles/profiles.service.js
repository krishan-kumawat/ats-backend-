import { Injectable, ConflictException, NotFoundException, Dependencies } from '@nestjs/common';
import { ProfilesRepository } from './profiles.repository.js';

@Injectable()
@Dependencies(ProfilesRepository)
export class ProfilesService {
  constructor(profilesRepository) {
    this.profilesRepository = profilesRepository;
  }

  async create(createProfileDto, creatorId) {
    const existing = await this.profilesRepository.findByName(createProfileDto.name);
    if (existing) {
      throw new ConflictException(`Profile with name '${createProfileDto.name}' already exists`);
    }
    return this.profilesRepository.create({
      ...createProfileDto,
      createdById: creatorId,
      lastModifiedById: creatorId,
    });
  }

  async findAll() {
    return this.profilesRepository.findAll();
  }

  async findOne(id) {
    const profile = await this.profilesRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Profile with ID '${id}' not found`);
    }
    return profile;
  }

  async update(id, updateProfileDto, modifierId) {
    await this.findOne(id);
    return this.profilesRepository.update(id, {
      ...updateProfileDto,
      lastModifiedById: modifierId,
    });
  }

  async remove(id) {
    await this.findOne(id);
    return this.profilesRepository.softDelete(id);
  }

  async assignPermissions(id, permissionIds) {
    await this.findOne(id);
    return this.profilesRepository.assignPermissions(id, permissionIds);
  }
}
