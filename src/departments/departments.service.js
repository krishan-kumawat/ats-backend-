import { Injectable, ConflictException, NotFoundException, Dependencies } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository.js';

@Injectable()
@Dependencies(DepartmentsRepository)
export class DepartmentsService {
  constructor(departmentsRepository) {
    this.departmentsRepository = departmentsRepository;
  }

  async create(createDepartmentDto, creatorId) {
    const nameTrimmed = createDepartmentDto.name?.trim();
    const existing = await this.departmentsRepository.findByName(nameTrimmed);
    if (existing) {
      throw new ConflictException(`Department with name '${nameTrimmed}' already exists`);
    }

    if (createDepartmentDto.parentId) {
      const parent = await this.departmentsRepository.findById(createDepartmentDto.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent department with ID '${createDepartmentDto.parentId}' not found`);
      }
    }

    return this.departmentsRepository.create({
      name: nameTrimmed,
      parentId: createDepartmentDto.parentId || null,
      createdById: creatorId,
      lastModifiedById: creatorId,
    });
  }

  async findAll() {
    return this.departmentsRepository.findAll();
  }

  async findOne(id) {
    const department = await this.departmentsRepository.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }
    return department;
  }

  async update(id, updateDepartmentDto, modifierId) {
    await this.findOne(id);
    
    const updateData = {};
    
    if (updateDepartmentDto.name) {
      const nameTrimmed = updateDepartmentDto.name.trim();
      if (nameTrimmed) {
        const existing = await this.departmentsRepository.findByName(nameTrimmed);
        if (existing && existing.id !== id) {
          throw new ConflictException(`Department with name '${nameTrimmed}' already exists`);
        }
        updateData.name = nameTrimmed;
      }
    }

    if (updateDepartmentDto.parentId !== undefined) {
      if (updateDepartmentDto.parentId === id) {
        throw new ConflictException('A department cannot be its own parent');
      }
      
      if (updateDepartmentDto.parentId) {
        // Prevent circular department hierarchy references
        let currentParentId = updateDepartmentDto.parentId;
        while (currentParentId) {
          if (currentParentId === id) {
            throw new ConflictException('Circular reference detected in department hierarchy');
          }
          const parent = await this.departmentsRepository.findById(currentParentId);
          currentParentId = parent?.parentId;
        }
      }
      
      updateData.parentId = updateDepartmentDto.parentId || null;
    }

    updateData.lastModifiedById = modifierId;

    return this.departmentsRepository.update(id, updateData);
  }

  async remove(id) {
    await this.findOne(id);
    return this.departmentsRepository.softDelete(id);
  }
}
