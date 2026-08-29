import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  HttpCode, HttpStatus, ParseUUIDPipe, Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseCategoryDto, UpdateExpenseCategoryDto,
  CreateExpenseDto, UpdateExpenseDto,
  CreateBankAccountDto, UpdateBankAccountDto,
} from './dto/expense.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}
  private sid(u: AuthUser) { return u.societyId as string; }

  @Post('categories') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT) @HttpCode(HttpStatus.CREATED)
  createCat(@Body() dto: CreateExpenseCategoryDto, @CurrentUser() u: AuthUser) {
    return this.expensesService.createCategory(this.sid(u), dto);
  }

  @Get('categories') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  findAllCats(@CurrentUser() u: AuthUser) { return this.expensesService.findAllCategories(this.sid(u)); }

  @Patch('categories/:id') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  updateCat(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseCategoryDto, @CurrentUser() u: AuthUser) {
    return this.expensesService.updateCategory(this.sid(u), id, dto);
  }

  @Delete('categories/:id') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN) @HttpCode(HttpStatus.NO_CONTENT)
  removeCat(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) {
    return this.expensesService.removeCategory(this.sid(u), id);
  }

  @Post() @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT) @HttpCode(HttpStatus.CREATED)
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() u: AuthUser) {
    return this.expensesService.createExpense(this.sid(u), dto, u.sub);
  }

  @Get() @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  findAll(@CurrentUser() u: AuthUser, @Query('categoryId') cat?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.expensesService.findAllExpenses(this.sid(u), { categoryId: cat, from, to });
  }

  @Get(':id') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) {
    return this.expensesService.findOneExpense(this.sid(u), id);
  }

  @Patch(':id') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseDto, @CurrentUser() u: AuthUser) {
    return this.expensesService.updateExpense(this.sid(u), id, dto);
  }

  @Patch(':id/approve') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) {
    return this.expensesService.approveExpense(this.sid(u), id, u.sub);
  }

  @Delete(':id') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT) @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) {
    return this.expensesService.removeExpense(this.sid(u), id);
  }
}

@Controller('finance')
export class FinanceController {
  constructor(private readonly expensesService: ExpensesService) {}
  private sid(u: AuthUser) { return u.societyId as string; }

  @Get('accounts') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  findAccounts(@CurrentUser() u: AuthUser) { return this.expensesService.findAllBankAccounts(this.sid(u)); }

  @Post('accounts') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT) @HttpCode(HttpStatus.CREATED)
  createAccount(@Body() dto: CreateBankAccountDto, @CurrentUser() u: AuthUser) {
    return this.expensesService.createBankAccount(this.sid(u), dto);
  }

  @Patch('accounts/:id') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  updateAccount(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBankAccountDto, @CurrentUser() u: AuthUser) {
    return this.expensesService.updateBankAccount(this.sid(u), id, dto);
  }

  @Get('summary') @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  summary(
    @CurrentUser() u: AuthUser,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.expensesService.getMonthlySummary(this.sid(u), parseInt(month, 10), parseInt(year, 10));
  }
}
