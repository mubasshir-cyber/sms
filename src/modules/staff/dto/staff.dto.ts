import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsEmail,
  Matches,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  StaffType,
  ShiftType,
  StaffStatus,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
} from '../../../common/enums/staff.enum';

// ─── Staff Member DTOs ─────────────────────────────────────────────────────────

export class CreateStaffMemberDto {
  @ApiProperty({ enum: StaffType, example: StaffType.HOUSEKEEPING })
  @IsEnum(StaffType)
  staffType: StaffType;

  @ApiProperty({ example: 'Ramesh Kumar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: 'ramesh@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '12, Gandhi Nagar, Mumbai - 400001' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/photos/staff1.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ example: '1234 5678 9012', description: 'Aadhaar number (stored encrypted)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  aadhaarNumber?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  panNumber?: string;

  @ApiPropertyOptional({ example: 12000.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monthlyWage?: number;

  @ApiPropertyOptional({ enum: ShiftType, default: ShiftType.MORNING })
  @IsOptional()
  @IsEnum(ShiftType)
  defaultShift?: ShiftType;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiPropertyOptional({ description: 'Set to true if this is a domestic helper (maid, cook, driver)', default: false })
  @IsOptional()
  @IsBoolean()
  isDomesticHelp?: boolean;

  @ApiPropertyOptional({ example: 'https://storage.example.com/docs/pv-doc.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  policeVerificationUrl?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/docs/aadhaar.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  aadhaarDocUrl?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/docs/id-proof.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  idProofDocUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStaffMemberDto {
  @ApiPropertyOptional({ enum: StaffType })
  @IsOptional()
  @IsEnum(StaffType)
  staffType?: StaffType;

  @ApiPropertyOptional({ enum: StaffStatus })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monthlyWage?: number;

  @ApiPropertyOptional({ enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  defaultShift?: ShiftType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  policeVerificationUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  aadhaarDocUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  idProofDocUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDomesticHelp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ExitStaffMemberDto {
  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  exitDate: string;

  @ApiProperty({ example: 'Resigned — personal reasons' })
  @IsString()
  @IsNotEmpty()
  exitReason: string;

  @ApiPropertyOptional({ enum: StaffStatus, default: StaffStatus.RESIGNED })
  @IsOptional()
  @IsEnum(StaffStatus)
  finalStatus?: StaffStatus;
}

export class StaffQueryDto {
  @ApiPropertyOptional({ enum: StaffType })
  @IsOptional()
  @IsEnum(StaffType)
  staffType?: StaffType;

  @ApiPropertyOptional({ enum: StaffStatus })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional({ enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  defaultShift?: ShiftType;

  @ApiPropertyOptional({ description: 'Filter domestic help only', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDomesticHelp?: boolean;

  @ApiPropertyOptional({ description: 'Search by name, phone, or staff code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

// ─── Attendance DTOs ────────────────────────────────────────────────────────────

export class RecordAttendanceDto {
  @ApiProperty({ example: '2026-09-05', description: 'Date in YYYY-MM-DD format' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: '08:30' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'checkinTime must be in HH:mm format' })
  checkinTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'checkoutTime must be in HH:mm format' })
  checkoutTime?: string;

  @ApiPropertyOptional({ description: 'Gate UUID (when marked by security guard)' })
  @IsOptional()
  @IsUUID()
  gateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAttendanceItemDto {
  @ApiProperty({ description: 'Staff Member UUID' })
  @IsUUID()
  staffId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: '08:30' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'checkinTime must be in HH:mm format' })
  checkinTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'checkoutTime must be in HH:mm format' })
  checkoutTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordBulkAttendanceDto {
  @ApiProperty({ example: '2026-09-05' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Gate UUID (for guard-initiated bulk marking)' })
  @IsOptional()
  @IsUUID()
  gateId?: string;

  @ApiProperty({ type: [BulkAttendanceItemDto] })
  @Type(() => BulkAttendanceItemDto)
  records: BulkAttendanceItemDto[];
}

export class AttendanceQueryDto {
  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

// ─── Shift DTOs ─────────────────────────────────────────────────────────────────

export class CreateStaffShiftDto {
  @ApiProperty({ enum: ShiftType })
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @ApiProperty({ example: '06:00', description: 'HH:mm format' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '14:00', description: 'HH:mm format' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateStaffShiftDto {
  @ApiPropertyOptional({ enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ─── Leave DTOs ─────────────────────────────────────────────────────────────────

export class ApplyLeaveDto {
  @ApiProperty({ enum: LeaveType, example: LeaveType.CASUAL })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ example: '2026-09-10' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-12' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Attending a family function in hometown' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ProcessLeaveDto {
  @ApiProperty({ enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] })
  @IsEnum(LeaveStatus)
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;

  @ApiPropertyOptional({ example: 'Leave approved. Ensure handover before leaving.' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class LeaveQueryDto {
  @ApiPropertyOptional({ enum: LeaveStatus })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiPropertyOptional({ enum: LeaveType })
  @IsOptional()
  @IsEnum(LeaveType)
  leaveType?: LeaveType;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ─── Task DTOs ──────────────────────────────────────────────────────────────────

export class CreateTaskDto {
  @ApiProperty({ example: 'Clean swimming pool area' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Scrub tiles and refill chemical levels' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-09-06' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({ example: 'Pool cleaned and chemicals balanced at 3 PM.' })
  @IsOptional()
  @IsString()
  completionNotes?: string;
}
