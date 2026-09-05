import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffMember } from './entities/staff-member.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { StaffShift } from './entities/staff-shift.entity';
import { StaffLeave } from './entities/staff-leave.entity';
import { StaffTask } from './entities/staff-task.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffMember,
      StaffAttendance,
      StaffShift,
      StaffLeave,
      StaffTask,
    ]),
    NotificationsModule,
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
