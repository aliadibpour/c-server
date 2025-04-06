import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/userEntity';
import { UserRepository } from './user.repository';
import { JwtModule } from 'src/common/jwt/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService]
})
export class UserModule {}
