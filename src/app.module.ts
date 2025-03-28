import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LiveMatchResultModule } from './live-match-result/live-match-result.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserEntity } from './user/entities/userEntity';

@Module({
   imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Aliadibpc0',
      entities: [UserEntity],
      database: 'corner', 
      autoLoadEntities: true, // به‌طور خودکار همه entityها را بارگذاری می‌کند
      synchronize: true, // در محیط توسعه جداول را خودکار می‌سازد
    }),
   //LiveMatchResultModule,
   AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
