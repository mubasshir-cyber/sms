import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facility } from './entities/facility.entity';
import { FacilityBooking } from './entities/facility-booking.entity';
import { FacilityBookingStatusHistory } from './entities/facility-booking-status-history.entity';
import { Resident } from '../residents/entities/resident.entity';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Facility,
      FacilityBooking,
      FacilityBookingStatusHistory,
      Resident,
    ]),
    NotificationsModule,
  ],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
