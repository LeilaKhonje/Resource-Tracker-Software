import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResourcerequestModule } from './resourcerequest/resourcerequest.module';

@Module({
  imports: [
  ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      
      type: process.env.DB_CONNECTION as any,          
      host:process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USERNAME,       
      password:  process.env.DB_PASSWORD, 
      database:  process.env.DB_DATABASE, 
      autoLoadEntities: true,    
      synchronize: true,         
    }),
    ResourcerequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
