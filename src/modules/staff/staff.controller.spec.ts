jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffType, ShiftType, StaffStatus, AttendanceStatus, LeaveType, LeaveStatus } from '../../common/enums/staff.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('StaffController', () => {
  let controller: StaffController;
  let service: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockAdminUser: AuthUser = {
    sub: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    role: Role.FACILITY_MANAGER,
    societyId: mockSocietyId,
  };

  const mockStaffId = '33333333-3333-3333-3333-333333333333';
  const mockStaff = {
    id: mockStaffId,
    societyId: mockSocietyId,
    staffCode: 'STF-2026-0001',
    staffType: StaffType.HOUSEKEEPING,
    status: StaffStatus.ACTIVE,
    name: 'Sunita Devi',
    phone: '+919876543210',
    isDomesticHelp: false,
  };

  beforeEach(async () => {
    service = {
      createStaffMember: jest.fn().mockResolvedValue(mockStaff),
      findStaffMembers: jest.fn().mockResolvedValue({ data: [mockStaff], total: 1, page: 1, limit: 20 }),
      findStaffMemberById: jest.fn().mockResolvedValue(mockStaff),
      updateStaffMember: jest.fn().mockResolvedValue(mockStaff),
      exitStaffMember: jest.fn().mockResolvedValue({ ...mockStaff, status: StaffStatus.RESIGNED }),
      deleteStaffMember: jest.fn().mockResolvedValue({ success: true }),
      recordAttendance: jest.fn().mockResolvedValue({ id: 'att-1', status: AttendanceStatus.PRESENT }),
      recordBulkAttendance: jest.fn().mockResolvedValue({ created: 3, skipped: 0 }),
      getStaffAttendance: jest.fn().mockResolvedValue([]),
      getSocietyAttendanceReport: jest.fn().mockResolvedValue([]),
      createShift: jest.fn().mockResolvedValue({ id: 'shift-1', shiftType: ShiftType.MORNING }),
      findShifts: jest.fn().mockResolvedValue([]),
      updateShift: jest.fn().mockResolvedValue({ id: 'shift-1', isActive: false }),
      applyLeave: jest.fn().mockResolvedValue({ id: 'leave-1', status: LeaveStatus.PENDING }),
      findLeaves: jest.fn().mockResolvedValue([]),
      findAllPendingLeaves: jest.fn().mockResolvedValue([]),
      processLeave: jest.fn().mockResolvedValue({ id: 'leave-1', status: LeaveStatus.APPROVED }),
      createTask: jest.fn().mockResolvedValue({ id: 'task-1', title: 'Clean lobby', isCompleted: false }),
      findTasks: jest.fn().mockResolvedValue([]),
      completeTask: jest.fn().mockResolvedValue({ id: 'task-1', isCompleted: true }),
      getAnalytics: jest.fn().mockResolvedValue({
        totalActive: 12,
        totalDomesticHelp: 5,
        todayPresent: 8,
        todayAbsent: 2,
        todayOnLeave: 1,
        pendingLeaves: 2,
        pendingTasks: 5,
        byType: { housekeeping: 6, security_guard: 4, gardener: 2 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffController],
      providers: [{ provide: StaffService, useValue: service }],
    }).compile();

    controller = module.get<StaffController>(StaffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createStaffMember', () => {
    it('should delegate to service and return created staff', async () => {
      const dto = { staffType: StaffType.HOUSEKEEPING, name: 'Sunita Devi', phone: '+91987654321' };
      const result = await controller.createStaffMember(mockAdminUser, dto as any);
      expect(service.createStaffMember).toHaveBeenCalledWith(mockAdminUser, dto);
      expect(result.staffCode).toBe('STF-2026-0001');
    });
  });

  describe('findStaffMembers', () => {
    it('should return paginated staff list', async () => {
      const result = await controller.findStaffMembers(mockAdminUser, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getAnalytics', () => {
    it('should return staff KPI metrics', async () => {
      const result = await controller.getAnalytics(mockAdminUser);
      expect(result.totalActive).toBe(12);
      expect(result.pendingLeaves).toBe(2);
      expect(result.byType.housekeeping).toBe(6);
    });
  });

  describe('recordAttendance', () => {
    it('should delegate attendance recording to service', async () => {
      const dto = { date: '2026-09-05', status: AttendanceStatus.PRESENT, checkinTime: '08:30' };
      const result = await controller.recordAttendance(mockAdminUser, mockStaffId, dto);
      expect(service.recordAttendance).toHaveBeenCalledWith(mockAdminUser, mockStaffId, dto);
      expect(result.status).toBe(AttendanceStatus.PRESENT);
    });
  });

  describe('applyLeave', () => {
    it('should apply leave via service', async () => {
      const dto = {
        leaveType: LeaveType.SICK,
        startDate: '2026-09-10',
        endDate: '2026-09-11',
        reason: 'Fever',
      };
      const result = await controller.applyLeave(mockAdminUser, mockStaffId, dto);
      expect(service.applyLeave).toHaveBeenCalledWith(mockAdminUser, mockStaffId, dto);
      expect(result.status).toBe(LeaveStatus.PENDING);
    });
  });

  describe('processLeave', () => {
    it('should approve leave via service', async () => {
      const dto = { status: LeaveStatus.APPROVED };
      const result = await controller.processLeave(mockAdminUser, 'leave-1', dto as any);
      expect(service.processLeave).toHaveBeenCalledWith(mockAdminUser, 'leave-1', dto);
      expect(result.status).toBe(LeaveStatus.APPROVED);
    });
  });

  describe('createTask', () => {
    it('should assign task via service', async () => {
      const dto = { title: 'Clean lobby area', dueDate: '2026-09-06' };
      const result = await controller.createTask(mockAdminUser, mockStaffId, dto);
      expect(service.createTask).toHaveBeenCalledWith(mockAdminUser, mockStaffId, dto);
      expect(result.isCompleted).toBe(false);
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed via service', async () => {
      const result = await controller.completeTask(mockAdminUser, 'task-1', { completionNotes: 'Done' });
      expect(result.isCompleted).toBe(true);
    });
  });
});
