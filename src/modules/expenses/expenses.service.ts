import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ExpenseCategory, Expense, BankAccount } from './entities/expense.entity';
import {
  CreateExpenseCategoryDto, UpdateExpenseCategoryDto,
  CreateExpenseDto, UpdateExpenseDto,
  CreateBankAccountDto, UpdateBankAccountDto,
} from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectRepository(ExpenseCategory) private readonly catRepo: Repository<ExpenseCategory>,
    @InjectRepository(Expense) private readonly expRepo: Repository<Expense>,
    @InjectRepository(BankAccount) private readonly bankRepo: Repository<BankAccount>,
  ) {}

  // ─── Categories ───────────────────────────────────────────────────────────

  async createCategory(societyId: string, dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    const existing = await this.catRepo.findOne({ where: { societyId, name: dto.name } });
    if (existing) throw new ConflictException(`Category "${dto.name}" already exists`);
    const cat = this.catRepo.create({ ...dto, societyId });
    return this.catRepo.save(cat);
  }

  async findAllCategories(societyId: string): Promise<ExpenseCategory[]> {
    return this.catRepo.find({ where: { societyId }, order: { name: 'ASC' } });
  }

  async updateCategory(societyId: string, id: string, dto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    const cat = await this.catRepo.findOne({ where: { id, societyId } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    Object.assign(cat, dto);
    return this.catRepo.save(cat);
  }

  async removeCategory(societyId: string, id: string): Promise<void> {
    const cat = await this.catRepo.findOne({ where: { id, societyId } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    await this.catRepo.softRemove(cat);
  }

  // ─── Expenses ─────────────────────────────────────────────────────────────

  async createExpense(societyId: string, dto: CreateExpenseDto, userId: string): Promise<Expense> {
    const cat = await this.catRepo.findOne({ where: { id: dto.categoryId, societyId } });
    if (!cat) throw new NotFoundException(`Category ${dto.categoryId} not found`);
    const expense = this.expRepo.create({
      ...dto,
      societyId,
      expenseDate: new Date(dto.expenseDate),
      addedByUserId: userId,
    });
    return this.expRepo.save(expense);
  }

  async findAllExpenses(
    societyId: string,
    filters?: { categoryId?: string; from?: string; to?: string },
  ): Promise<Expense[]> {
    const qb = this.expRepo.createQueryBuilder('e').where('e.society_id = :societyId', { societyId });
    if (filters?.categoryId) qb.andWhere('e.category_id = :cat', { cat: filters.categoryId });
    if (filters?.from && filters?.to) {
      qb.andWhere('e.expense_date BETWEEN :from AND :to', { from: filters.from, to: filters.to });
    }
    return qb.orderBy('e.expense_date', 'DESC').getMany();
  }

  async findOneExpense(societyId: string, id: string): Promise<Expense> {
    const e = await this.expRepo.findOne({ where: { id, societyId } });
    if (!e) throw new NotFoundException(`Expense ${id} not found`);
    return e;
  }

  async updateExpense(societyId: string, id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOneExpense(societyId, id);
    Object.assign(expense, {
      ...dto,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : expense.expenseDate,
    });
    return this.expRepo.save(expense);
  }

  async approveExpense(societyId: string, id: string, approvedByUserId: string): Promise<Expense> {
    const expense = await this.findOneExpense(societyId, id);
    expense.isApproved = true;
    expense.approvedByUserId = approvedByUserId;
    return this.expRepo.save(expense);
  }

  async removeExpense(societyId: string, id: string): Promise<void> {
    const expense = await this.findOneExpense(societyId, id);
    await this.expRepo.softRemove(expense);
  }

  // ─── Bank Accounts ────────────────────────────────────────────────────────

  async createBankAccount(societyId: string, dto: CreateBankAccountDto): Promise<BankAccount> {
    if (dto.isPrimary) {
      await this.bankRepo.update({ societyId }, { isPrimary: false });
    }
    const acct = this.bankRepo.create({
      ...dto,
      societyId,
      currentBalance: dto.openingBalance ?? 0,
    });
    return this.bankRepo.save(acct);
  }

  async findAllBankAccounts(societyId: string): Promise<BankAccount[]> {
    return this.bankRepo.find({ where: { societyId, isActive: true }, order: { isPrimary: 'DESC' } });
  }

  async updateBankAccount(societyId: string, id: string, dto: UpdateBankAccountDto): Promise<BankAccount> {
    const acct = await this.bankRepo.findOne({ where: { id, societyId } });
    if (!acct) throw new NotFoundException(`Bank account ${id} not found`);
    if (dto.isPrimary) {
      await this.bankRepo.update({ societyId }, { isPrimary: false });
    }
    Object.assign(acct, dto);
    return this.bankRepo.save(acct);
  }

  // ─── Finance Summary ──────────────────────────────────────────────────────

  async getMonthlySummary(
    societyId: string,
    month: number,
    year: number,
  ): Promise<{ totalExpenses: number; byCategory: Record<string, number> }> {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0); // last day of month

    const expenses = await this.expRepo.find({
      where: { societyId, expenseDate: Between(from, to) as unknown as Date },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.categoryId] = (byCategory[e.categoryId] ?? 0) + Number(e.amount);
    }

    return { totalExpenses, byCategory };
  }
}
