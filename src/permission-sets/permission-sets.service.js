import { Injectable, ConflictException, NotFoundException, Dependencies } from '@nestjs/common';
import { PermissionSetsRepository } from './permission-sets.repository.js';

@Injectable()
@Dependencies(PermissionSetsRepository)
export class PermissionSetsService {
  constructor(permissionSetsRepository) {
    this.permissionSetsRepository = permissionSetsRepository;
  }

  async create(createPermissionSetDto, creatorId) {
    const existing = await this.permissionSetsRepository.findByName(createPermissionSetDto.name);
    if (existing) {
      throw new ConflictException(`Permission set with name '${createPermissionSetDto.name}' already exists`);
    }
    return this.permissionSetsRepository.create({
      ...createPermissionSetDto,
      createdById: creatorId,
      lastModifiedById: creatorId,
    });
  }

  async findAll() {
    return this.permissionSetsRepository.findAll();
  }

  async findOne(id) {
    const permSet = await this.permissionSetsRepository.findById(id);
    if (!permSet) {
      throw new NotFoundException(`Permission set with ID '${id}' not found`);
    }
    return permSet;
  }

  async update(id, updatePermissionSetDto, modifierId) {
    await this.findOne(id);
    return this.permissionSetsRepository.update(id, {
      ...updatePermissionSetDto,
      lastModifiedById: modifierId,
    });
  }

  async remove(id) {
    await this.findOne(id);
    return this.permissionSetsRepository.softDelete(id);
  }

  async assignPermissions(id, permissionIds) {
    await this.findOne(id);
    return this.permissionSetsRepository.assignPermissions(id, permissionIds);
  }
}
