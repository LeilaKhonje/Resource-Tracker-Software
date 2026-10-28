import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resources } from './entities/resources.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resources])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService]
})
export class ResourcesModule {}
