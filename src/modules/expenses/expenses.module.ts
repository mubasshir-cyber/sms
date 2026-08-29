import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseCategory, Expense, BankAccount } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController, FinanceController } from './expenses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseCategory, Expense, BankAccount])],
  controllers: [ExpensesController, FinanceController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
