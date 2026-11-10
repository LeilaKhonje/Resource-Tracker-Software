import { Module } from '@nestjs/common';
import { User } from '../users/user.entity';
import { AuthSecurityModule } from '../auth/auth-security.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resources } from './entities/resources.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resources, User]), AuthSecurityModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
