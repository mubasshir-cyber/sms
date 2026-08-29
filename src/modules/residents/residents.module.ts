import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resident } from './entities/resident.entity';
import { FamilyMember } from './entities/family-member.entity';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { StructureModule } from '../structure/structure.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resident, FamilyMember]),
    StructureModule,
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService],
})
export class ResidentsModule {}
