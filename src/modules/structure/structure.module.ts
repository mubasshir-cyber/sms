import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tower } from './entities/tower.entity';
import { Floor } from './entities/floor.entity';
import { Unit } from './entities/unit.entity';
import { StructureService } from './structure.service';
import { StructureController } from './structure.controller';
import { SocietiesModule } from '../societies/societies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tower, Floor, Unit]),
    SocietiesModule,
  ],
  controllers: [StructureController],
  providers: [StructureService],
  exports: [StructureService],
})
export class StructureModule {}
