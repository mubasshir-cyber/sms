import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Unit } from '../structure/entities/unit.entity';
import { Invoice } from '../maintenance/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Complaint } from '../complaints/entities/complaint.entity';
import { VisitorLog } from '../visitors/entities/visitor-log.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { StaffAttendance } from '../staff/entities/staff-attendance.entity';
import { ParkingSlot } from '../vehicles/entities/parking-slot.entity';
import { FacilityBooking } from '../facilities/entities/facility-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Unit,
      Invoice,
      Payment,
      Expense,
      Complaint,
      VisitorLog,
      Delivery,
      StaffAttendance,
      ParkingSlot,
      FacilityBooking,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
