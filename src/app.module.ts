import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodoModule } from './todo/todo.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { Document } from './user/entities/document.entity';

@Module({
  imports: [TodoModule, UserModule, TypeOrmModule.forRoot({
    type: 'postgres',
    url: "postgresql://neondb_owner:JhUaMFj71WoE@ep-long-wind-a5yc91se-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
    host: 'localhost',
    port:4000,
    name: 'postgres',
    password: 'root',
    entities: [ 
        User,
        Document
    ],
    synchronize: true,
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
