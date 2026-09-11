import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { ParkingSlot } from './entities/parking-slot.entity';
import { ParkingAllocation } from './entities/parking-allocation.entity';
import { ParkingTransfer } from './entities/parking-transfer.entity';
import { Resident } from '../residents/entities/resident.entity';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
      ParkingSlot,
      ParkingAllocation,
      ParkingTransfer,
      Resident,
    ]),
    NotificationsModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
