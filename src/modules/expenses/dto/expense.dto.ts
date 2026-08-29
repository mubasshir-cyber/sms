import {
  IsString, IsUUID, IsNumber, IsOptional, IsBoolean,
  IsDateString, MinLength, MaxLength, Min,
} from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
}

export class UpdateExpenseCategoryDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateExpenseDto {
  @IsUUID() categoryId: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) amount: number;
  @IsDateString() expenseDate: string;
  @IsString() @MinLength(2) description: string;
  @IsOptional() @IsString() @MaxLength(150) vendorName?: string;
  @IsOptional() @IsString() @MaxLength(50) invoiceNo?: string;
  @IsOptional() @IsString() receiptUrl?: string;
}

export class UpdateExpenseDto {
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) amount?: number;
  @IsOptional() @IsDateString() expenseDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(150) vendorName?: string;
  @IsOptional() @IsString() @MaxLength(50) invoiceNo?: string;
  @IsOptional() @IsString() receiptUrl?: string;
}

export class CreateBankAccountDto {
  @IsString() @MaxLength(100) bankName: string;
  @IsString() @MaxLength(30) accountNumber: string;
  @IsString() @MaxLength(20) ifscCode: string;
  @IsOptional() @IsString() accountType?: 'savings' | 'current';
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) openingBalance?: number;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class UpdateBankAccountDto {
  @IsOptional() @IsString() @MaxLength(100) bankName?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) currentBalance?: number;
}
