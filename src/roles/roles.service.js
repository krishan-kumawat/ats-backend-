import { Injectable, ConflictException, NotFoundException, Dependencies } from '@nestjs/common';
import { RolesRepository } from './roles.repository.js';

@Injectable()
@Dependencies(RolesRepository)
export class RolesService {
  constructor(rolesRepository) {
    this.rolesRepository = rolesRepository;
  }

  async create(createRoleDto) {
    const existing = await this.rolesRepository.findByName(createRoleDto.name);
    if (existing) {
      throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
    }

    if (createRoleDto.parentId) {
      const parent = await this.rolesRepository.findById(createRoleDto.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent role with ID '${createRoleDto.parentId}' not found`);
      }
    }

    return this.rolesRepository.create(createRoleDto);
  }

  async findAll() {
    return this.rolesRepository.findAll();
  }

  async findOne(id) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }
    return role;
  }

  async update(id, updateRoleDto) {
    await this.findOne(id);
    
    if (updateRoleDto.parentId) {
      if (updateRoleDto.parentId === id) {
        throw new ConflictException('A role cannot be its own parent');
      }
      const parent = await this.rolesRepository.findById(updateRoleDto.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent role with ID '${updateRoleDto.parentId}' not found`);
      }
    }
    
    return this.rolesRepository.update(id, updateRoleDto);
  }

  async remove(id) {
    await this.findOne(id);
    return this.rolesRepository.softDelete(id);
  }
}
