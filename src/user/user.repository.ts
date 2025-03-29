import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/userEntity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createUser(phoneNumber: string): Promise<UserEntity> {
    const user = this.userRepo.create({ phoneNumber });
    return this.userRepo.save(user);
  }

  async findUserByPhone(phoneNumber: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { phoneNumber } });
  }
}
