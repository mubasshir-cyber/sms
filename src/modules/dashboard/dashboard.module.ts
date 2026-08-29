import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Unit } from '../structure/entities/unit.entity';
import { Invoice } from '../maintenance/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Unit, Invoice, Payment, Expense])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
