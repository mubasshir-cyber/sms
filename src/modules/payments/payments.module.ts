import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RazorpayService } from './razorpay.service';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { SocietiesModule } from '../societies/societies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    MaintenanceModule,
    SocietiesModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
