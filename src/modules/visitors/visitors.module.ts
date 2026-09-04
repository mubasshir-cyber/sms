import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gate } from './entities/gate.entity';
import { GateAssignment } from './entities/gate-assignment.entity';
import { Visitor } from './entities/visitor.entity';
import { VisitorLog } from './entities/visitor-log.entity';
import { SecurityIncident } from './entities/security-incident.entity';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Gate,
      GateAssignment,
      Visitor,
      VisitorLog,
      SecurityIncident,
    ]),
    NotificationsModule,
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
