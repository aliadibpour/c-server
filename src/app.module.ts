import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LiveMatchResultModule } from './live-match-result/live-match-result.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginModule } from './login/login.module';
import { UserEntity } from './user/entities/userEntity';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';

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
      synchronize: true, // create auto tables in developing mode
    }),
   ConfigModule.forRoot({ isGlobal: true }),
   //LiveMatchResultModule,
   LoginModule,
   TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
