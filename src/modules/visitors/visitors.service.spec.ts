import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { Gate } from './entities/gate.entity';
import { GateAssignment } from './entities/gate-assignment.entity';
import { Visitor } from './entities/visitor.entity';
import { VisitorLog } from './entities/visitor-log.entity';
import { SecurityIncident } from './entities/security-incident.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { VisitorStatus } from '../../common/enums/visitor.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('VisitorsService', () => {
  let service: VisitorsService;

  const mockGatesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockAssignmentsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockVisitorsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockLogsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockIncidentsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockNotificationsService = {
    send: jest.fn(),
  };

  const guardUser: AuthUser = {
    sub: 'guard-1',
    email: 'guard@soc.com',
    role: Role.SECURITY_GUARD,
    societyId: 'soc-123',
    gateId: 'gate-1',
    iat: 0,
    exp: 0,
  };

  const residentUser: AuthUser = {
    sub: 'res-1',
    email: 'res@soc.com',
    role: Role.RESIDENT,
    societyId: 'soc-123',
    unitId: 'unit-101',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitorsService,
        { provide: getRepositoryToken(Gate), useValue: mockGatesRepo },
        { provide: getRepositoryToken(GateAssignment), useValue: mockAssignmentsRepo },
        { provide: getRepositoryToken(Visitor), useValue: mockVisitorsRepo },
        { provide: getRepositoryToken(VisitorLog), useValue: mockLogsRepo },
        { provide: getRepositoryToken(SecurityIncident), useValue: mockIncidentsRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<VisitorsService>(VisitorsService);
  });

  describe('inviteVisitor', () => {
    it('should generate pass with OTP and QR code for resident visitor (happy path)', async () => {
      const mockVisitor = {
        id: 'vis-1',
        name: 'Jane Guest',
        passcode: '123456',
        societyId: 'soc-123',
        status: VisitorStatus.EXPECTED,
      };
      mockVisitorsRepo.create.mockReturnValue(mockVisitor);
      mockVisitorsRepo.save.mockResolvedValue(mockVisitor);

      const dto = {
        name: 'Jane Guest',
        phone: '9876543210',
        expectedArrival: new Date().toISOString(),
      };

      const result = await service.inviteVisitor(residentUser, dto as any);

      expect(result.id).toBe('vis-1');
      expect(mockVisitorsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hostUserId: 'res-1',
          societyId: 'soc-123',
          passcode: expect.any(String),
        }),
      );
    });
  });

  describe('checkInVisitor', () => {
    it('should check in expected visitor and record gate entry log', async () => {
      const mockVisitor = {
        id: 'vis-1',
        name: 'Jane Guest',
        status: VisitorStatus.EXPECTED,
        isBlacklisted: false,
        societyId: 'soc-123',
      };
      mockVisitorsRepo.findOne.mockResolvedValueOnce(mockVisitor);
      mockGatesRepo.findOne.mockResolvedValueOnce({ id: 'gate-1', societyId: 'soc-123' });
      mockVisitorsRepo.save.mockImplementation(async (v) => v);
      mockLogsRepo.create.mockReturnValue({ id: 'log-1' });
      mockLogsRepo.save.mockResolvedValue({ id: 'log-1' });

      const dto = {
        gateId: 'gate-1',
        vehicleNumber: 'KA01AB1234',
      };

      const result = await service.checkInVisitor(guardUser, 'vis-1', dto as any);

      expect(result.visitor.status).toBe(VisitorStatus.CHECKED_IN);
      expect(mockLogsRepo.save).toHaveBeenCalled();
    });

    it('should block check-in for blacklisted visitors (security boundary)', async () => {
      const mockVisitor = {
        id: 'vis-bad',
        name: 'Intruder',
        isBlacklisted: true,
        blacklistReason: 'Threat to residents',
        societyId: 'soc-123',
      };
      mockVisitorsRepo.findOne.mockResolvedValueOnce(mockVisitor);

      const dto = { gateId: 'gate-1' };

      await expect(service.checkInVisitor(guardUser, 'vis-bad', dto as any)).rejects.toThrow(BadRequestException);
    });
  });
});
