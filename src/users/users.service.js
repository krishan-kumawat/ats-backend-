import { Injectable, ConflictException, NotFoundException, Dependencies } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { BcryptService } from '../auth/bcrypt.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(UsersRepository, BcryptService, PrismaService)
export class UsersService {
  constructor(usersRepository, bcryptService, prismaService) {
    this.usersRepository = usersRepository;
    this.bcryptService = bcryptService;
    this.prismaService = prismaService;
  }

  async create(createUserDto, creatorId) {
    const existing = await this.usersRepository.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException(`User with email '${createUserDto.email}' already exists`);
    }

    // 1. Resolve Profile UUID by Name
    const profile = await this.prismaService.profile.findUnique({
      where: { name: createUserDto.profileName, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException(`Profile with name '${createUserDto.profileName}' not found`);
    }

    // 2. Resolve Role UUID by Name
    let roleId = null;
    if (createUserDto.roleName) {
      const role = await this.prismaService.role.findUnique({
        where: { name: createUserDto.roleName, deletedAt: null },
      });
      if (!role) {
        throw new NotFoundException(`Role with name '${createUserDto.roleName}' not found`);
      }
      roleId = role.id;
    }

    // 3. Resolve Department UUID by Name
    let departmentId = null;
    if (createUserDto.departmentName) {
      const department = await this.prismaService.department.findUnique({
        where: { name: createUserDto.departmentName, deletedAt: null },
      });
      if (!department) {
        throw new NotFoundException(`Department with name '${createUserDto.departmentName}' not found`);
      }
      departmentId = department.id;
    }

    const passwordHash = await this.bcryptService.hash(createUserDto.password);
    
    return this.usersRepository.create({
      email: createUserDto.email,
      passwordHash,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      profileId: profile.id,
      roleId,
      departmentId,
      createdById: creatorId,
      lastModifiedById: creatorId,
    });
  }

  async findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return user;
  }

  async update(id, updateUserDto, modifierId) {
    await this.findOne(id);
    
    const updateData = {};
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.firstName) updateData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) updateData.lastName = updateUserDto.lastName;

    if (updateUserDto.password) {
      updateData.passwordHash = await this.bcryptService.hash(updateUserDto.password);
    }

    // Resolve name-based fields dynamically during updates
    if (updateUserDto.profileName) {
      const profile = await this.prismaService.profile.findUnique({
        where: { name: updateUserDto.profileName, deletedAt: null },
      });
      if (!profile) {
        throw new NotFoundException(`Profile with name '${updateUserDto.profileName}' not found`);
      }
      updateData.profileId = profile.id;
    }

    if (updateUserDto.roleName) {
      const role = await this.prismaService.role.findUnique({
        where: { name: updateUserDto.roleName, deletedAt: null },
      });
      if (!role) {
        throw new NotFoundException(`Role with name '${updateUserDto.roleName}' not found`);
      }
      updateData.roleId = role.id;
    }

    if (updateUserDto.departmentName) {
      const department = await this.prismaService.department.findUnique({
        where: { name: updateUserDto.departmentName, deletedAt: null },
      });
      if (!department) {
        throw new NotFoundException(`Department with name '${updateUserDto.departmentName}' not found`);
      }
      updateData.departmentId = department.id;
    }

    updateData.lastModifiedById = modifierId;

    return this.usersRepository.update(id, updateData);
  }

  async remove(id) {
    await this.findOne(id);
    return this.usersRepository.softDelete(id);
  }

  async assignPermissionSets(userId, permissionSetIds) {
    await this.findOne(userId);
    return this.usersRepository.assignPermissionSets(userId, permissionSetIds);
  }

  async removePermissionSet(userId, permissionSetId) {
    await this.findOne(userId);
    return this.usersRepository.removePermissionSet(userId, permissionSetId);
  }
}
