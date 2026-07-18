import { Injectable, ConflictException, NotFoundException, Dependencies } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { BcryptService } from '../auth/bcrypt.service.js';

@Injectable()
@Dependencies(UsersRepository, BcryptService)
export class UsersService {
  constructor(usersRepository, bcryptService) {
    this.usersRepository = usersRepository;
    this.bcryptService = bcryptService;
  }

  async create(createUserDto) {
    const existing = await this.usersRepository.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException(`User with email '${createUserDto.email}' already exists`);
    }

    const passwordHash = await this.bcryptService.hash(createUserDto.password);
    
    const { password, ...userData } = createUserDto;
    return this.usersRepository.create({
      ...userData,
      passwordHash,
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

  async update(id, updateUserDto) {
    await this.findOne(id);
    
    const updateData = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.passwordHash = await this.bcryptService.hash(updateUserDto.password);
      delete updateData.password;
    }

    return this.usersRepository.update(id, updateData);
  }

  async remove(id) {
    await this.findOne(id);
    return this.usersRepository.softDelete(id);
  }

  async assignPermissionSets(id, permissionSetIds) {
    await this.findOne(id);
    return this.usersRepository.assignPermissionSets(id, permissionSetIds);
  }
}
