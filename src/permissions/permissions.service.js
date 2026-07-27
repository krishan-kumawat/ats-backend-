import { Injectable, ConflictException, NotFoundException, Dependencies } from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository.js';

@Injectable()
@Dependencies(PermissionsRepository)
export class PermissionsService {
  constructor(permissionsRepository) {
    this.permissionsRepository = permissionsRepository;
  }

  async create(createPermissionDto) {
    const existing = await this.permissionsRepository.findByCode(createPermissionDto.code);
    if (existing) {
      throw new ConflictException(`Permission with code '${createPermissionDto.code}' already exists`);
    }
    return this.permissionsRepository.create(createPermissionDto);
  }

  async findAll() {
    return this.permissionsRepository.findAll();
  }

  async findOne(id) {
    const permission = await this.permissionsRepository.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }
    return permission;
  }
}
