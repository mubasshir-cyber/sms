jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffMember } from './entities/staff-member.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { StaffShift } from './entities/staff-shift.entity';
import { StaffLeave } from './entities/staff-leave.entity';
import { StaffTask } from './entities/staff-task.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { StaffType, ShiftType, StaffStatus, AttendanceStatus, LeaveType, LeaveStatus } from '../../common/enums/staff.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('StaffService', () => {
  let service: StaffService;
  let staffRepo: any;
  let attendanceRepo: any;
  let shiftsRepo: any;
  let leavesRepo: any;
  let tasksRepo: any;
  let notificationsService: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockAdminUser: AuthUser = {
    sub: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    role: Role.SOCIETY_ADMIN,
    societyId: mockSocietyId,
  };

  const mockStaff: StaffMember = {
    id: '33333333-3333-3333-3333-333333333333',
    societyId: mockSocietyId,
    staffCode: 'STF-2026-0001',
    staffType: StaffType.HOUSEKEEPING,
    status: StaffStatus.ACTIVE,
    name: 'Sunita Devi',
    phone: '+919876543210',
    email: null,
    dateOfBirth: null,
    address: null,
    photoUrl: null,
    aadhaarNumber: '1234 5678 9012',
    panNumber: null,
    monthlyWage: 10000,
    defaultShift: ShiftType.MORNING,
    joinDate: new Date('2026-01-01'),
    exitDate: null,
    exitReason: null,
    isDomesticHelp: false,
    policeVerificationUrl: null,
    aadhaarDocUrl: null,
    idProofDocUrl: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockAttendance: StaffAttendance = {
    id: '44444444-4444-4444-4444-444444444444',
    societyId: mockSocietyId,
    staffId: mockStaff.id,
    date: '2026-09-05',
    status: AttendanceStatus.PRESENT,
    checkinTime: '08:30',
    checkoutTime: null,
    gateId: null,
    markedByUserId: mockAdminUser.sub,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockLeave: StaffLeave = {
    id: '55555555-5555-5555-5555-555555555555',
    societyId: mockSocietyId,
    staffId: mockStaff.id,
    leaveType: LeaveType.CASUAL,
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    totalDays: 3,
    reason: 'Family function',
    status: LeaveStatus.PENDING,
    appliedByUserId: mockAdminUser.sub,
    approvedByUserId: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTask: StaffTask = {
    id: '66666666-6666-6666-6666-666666666666',
    societyId: mockSocietyId,
    staffId: mockStaff.id,
    assignedByUserId: mockAdminUser.sub,
    title: 'Clean lobby area',
    description: null,
    dueDate: '2026-09-06',
    isCompleted: false,
    completedAt: null,
    completionNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const createQueryBuilderMock = () => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockStaff], 1]),
      getMany: jest.fn().mockResolvedValue([mockAttendance]),
      getRawMany: jest.fn().mockResolvedValue([{ type: 'housekeeping', count: '1' }]),
    });

    staffRepo = {
      create: jest.fn().mockImplementation(dto => ({ ...dto })),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ ...mockStaff, ...entity })),
      findOne: jest.fn().mockResolvedValue(mockStaff),
      find: jest.fn().mockResolvedValue([mockStaff]),
      count: jest.fn().mockResolvedValue(1),
      softRemove: jest.fn().mockResolvedValue(mockStaff),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock()),
    };

    attendanceRepo = {
      create: jest.fn().mockImplementation(dto => ({ ...dto })),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ ...mockAttendance, ...entity })),
      findOne: jest.fn().mockResolvedValue(null), // no existing attendance by default
      find: jest.fn().mockResolvedValue([mockAttendance]),
      count: jest.fn().mockResolvedValue(5),
      createQueryBuilder: jest.fn().mockReturnValue({
        ...createQueryBuilderMock(),
        getMany: jest.fn().mockResolvedValue([mockAttendance]),
        getRawMany: jest.fn().mockResolvedValue([{ date: '2026-09-05', present: '3', absent: '1', halfDay: '0', onLeave: '1' }]),
      }),
    };

    shiftsRepo = {
      create: jest.fn().mockImplementation(dto => ({ ...dto, id: 'shift-uuid' })),
      save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
      findOne: jest.fn().mockResolvedValue({ id: 'shift-uuid', staffId: mockStaff.id }),
      find: jest.fn().mockResolvedValue([]),
    };

    leavesRepo = {
      create: jest.fn().mockImplementation(dto => ({ ...dto })),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ ...mockLeave, ...entity })),
      findOne: jest.fn().mockResolvedValue(mockLeave),
      find: jest.fn().mockResolvedValue([mockLeave]),
      count: jest.fn().mockResolvedValue(2),
      createQueryBuilder: jest.fn().mockReturnValue({
        ...createQueryBuilderMock(),
        getMany: jest.fn().mockResolvedValue([mockLeave]),
      }),
    };

    tasksRepo = {
      create: jest.fn().mockImplementation(dto => ({ ...dto })),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ ...mockTask, ...entity })),
      findOne: jest.fn().mockResolvedValue(mockTask),
      find: jest.fn().mockResolvedValue([mockTask]),
      count: jest.fn().mockResolvedValue(3),
    };

    notificationsService = {
      send: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      sendBulk: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: getRepositoryToken(StaffMember), useValue: staffRepo },
        { provide: getRepositoryToken(StaffAttendance), useValue: attendanceRepo },
        { provide: getRepositoryToken(StaffShift), useValue: shiftsRepo },
        { provide: getRepositoryToken(StaffLeave), useValue: leavesRepo },
        { provide: getRepositoryToken(StaffTask), useValue: tasksRepo },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
  });

  describe('createStaffMember', () => {
    it('should create a staff member with auto-generated staff code', async () => {
      staffRepo.count.mockResolvedValueOnce(0);
      const result = await service.createStaffMember(mockAdminUser, {
        staffType: StaffType.HOUSEKEEPING,
        name: 'Sunita Devi',
        phone: '+919876543210',
        monthlyWage: 10000,
      });
      expect(result).toBeDefined();
      expect(staffRepo.save).toHaveBeenCalled();
    });
  });

  describe('findStaffMemberById', () => {
    it('should return staff and mask aadhaar', async () => {
      const result = await service.findStaffMemberById(mockAdminUser, mockStaff.id);
      expect(result.aadhaarNumber).toMatch(/^XXXX-XXXX-\d{4}$/);
    });

    it('should throw NotFoundException if not found', async () => {
      staffRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findStaffMemberById(mockAdminUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exitStaffMember', () => {
    it('should mark staff as resigned with exit date', async () => {
      const result = await service.exitStaffMember(mockAdminUser, mockStaff.id, {
        exitDate: '2026-09-30',
        exitReason: 'Personal reasons',
        finalStatus: StaffStatus.RESIGNED,
      });
      expect(result.status).toBe(StaffStatus.RESIGNED);
    });

    it('should throw BadRequest if already resigned', async () => {
      staffRepo.findOne.mockResolvedValueOnce({ ...mockStaff, status: StaffStatus.RESIGNED });
      await expect(
        service.exitStaffMember(mockAdminUser, mockStaff.id, {
          exitDate: '2026-09-30',
          exitReason: 'Already exited',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordAttendance', () => {
    it('should record attendance successfully', async () => {
      const result = await service.recordAttendance(mockAdminUser, mockStaff.id, {
        date: '2026-09-05',
        status: AttendanceStatus.PRESENT,
        checkinTime: '08:30',
      });
      expect(result).toBeDefined();
      expect(attendanceRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if attendance already exists for the date', async () => {
      attendanceRepo.findOne.mockResolvedValueOnce(mockAttendance);
      await expect(
        service.recordAttendance(mockAdminUser, mockStaff.id, {
          date: '2026-09-05',
          status: AttendanceStatus.PRESENT,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('recordBulkAttendance', () => {
    it('should record bulk attendance and skip existing', async () => {
      attendanceRepo.findOne.mockResolvedValueOnce(mockAttendance); // first is duplicate
      attendanceRepo.findOne.mockResolvedValueOnce(null);           // second is new

      const result = await service.recordBulkAttendance(mockAdminUser, {
        date: '2026-09-05',
        records: [
          { staffId: mockStaff.id, status: AttendanceStatus.PRESENT },
          { staffId: '77777777-7777-7777-7777-777777777777', status: AttendanceStatus.ABSENT },
        ],
      });

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  describe('applyLeave', () => {
    it('should apply leave and notify', async () => {
      const result = await service.applyLeave(mockAdminUser, mockStaff.id, {
        leaveType: LeaveType.CASUAL,
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        reason: 'Family function',
      });
      expect(result.status).toBe(LeaveStatus.PENDING);
      expect(result.totalDays).toBe(3);
      expect(notificationsService.send).toHaveBeenCalled();
    });

    it('should throw BadRequest if endDate is before startDate', async () => {
      await expect(
        service.applyLeave(mockAdminUser, mockStaff.id, {
          leaveType: LeaveType.CASUAL,
          startDate: '2026-09-15',
          endDate: '2026-09-10',
          reason: 'Invalid range',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processLeave', () => {
    it('should approve a pending leave and notify', async () => {
      const result = await service.processLeave(mockAdminUser, mockLeave.id, {
        status: LeaveStatus.APPROVED,
      });
      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(notificationsService.send).toHaveBeenCalled();
    });

    it('should throw BadRequest if leave is already approved', async () => {
      leavesRepo.findOne.mockResolvedValueOnce({ ...mockLeave, status: LeaveStatus.APPROVED });
      await expect(
        service.processLeave(mockAdminUser, mockLeave.id, { status: LeaveStatus.APPROVED }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createTask', () => {
    it('should assign a task to a staff member', async () => {
      const result = await service.createTask(mockAdminUser, mockStaff.id, {
        title: 'Clean lobby area',
        dueDate: '2026-09-06',
      });
      expect(result).toBeDefined();
      expect(tasksRepo.save).toHaveBeenCalled();
    });
  });

  describe('completeTask', () => {
    it('should mark a task as completed', async () => {
      const result = await service.completeTask(mockAdminUser, mockTask.id, {
        completionNotes: 'Done at 3 PM',
      });
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBeDefined();
    });

    it('should throw BadRequest if task already completed', async () => {
      tasksRepo.findOne.mockResolvedValueOnce({ ...mockTask, isCompleted: true });
      await expect(
        service.completeTask(mockAdminUser, mockTask.id, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAnalytics', () => {
    it('should return staff KPI metrics', async () => {
      const result = await service.getAnalytics(mockAdminUser);
      expect(result).toHaveProperty('totalActive');
      expect(result).toHaveProperty('todayPresent');
      expect(result).toHaveProperty('pendingLeaves');
      expect(result).toHaveProperty('byType');
    });
  });
});
