import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  private users: CreateUserDto[] = [
    {
      name: "Ali",
      age:19
    },
    {
      name: "Alireza",
      age:12
    }
  ]

  constructor(
    @InjectRepository(User)
    private repo: Repository<User>) {}

  create(createUserDto: CreateUserDto) {
    this.users.push(createUserDto)
    return this.users;
  }

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
