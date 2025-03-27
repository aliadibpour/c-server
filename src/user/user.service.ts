import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity } from './entities/userEntity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async registerUser(phoneNumber: number): Promise<UserEntity> {
    const existingUser = await this.userRepository.findUserByPhone(phoneNumber);
    if (existingUser) return existingUser;

    return this.userRepository.createUser(phoneNumber);
  }
}
