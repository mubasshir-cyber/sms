import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Society } from './entities/society.entity';
import { SocietiesService } from './societies.service';
import { SocietiesController } from './societies.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Society]),
    TenantsModule, // Provides TenantsService for capacity checks
  ],
  controllers: [SocietiesController],
  providers: [SocietiesService],
  exports: [SocietiesService], // Exported so other modules can use findOneInternal, incrementUnitCount, etc.
})
export class SocietiesModule {}
