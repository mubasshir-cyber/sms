import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('VisitorsController', () => {
  let controller: VisitorsController;

  const mockVisitorsService = {
    createGate: jest.fn(),
    findGates: jest.fn(),
    inviteVisitor: jest.fn(),
    checkInVisitor: jest.fn(),
    checkOutVisitor: jest.fn(),
    createIncident: jest.fn(),
  };

  const dummyUser: AuthUser = {
    sub: 'guard-1',
    email: 'guard@soc.com',
    role: Role.SECURITY_GUARD,
    societyId: 'soc-1',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitorsController],
      providers: [
        { provide: VisitorsService, useValue: mockVisitorsService },
      ],
    }).compile();

    controller = module.get<VisitorsController>(VisitorsController);
  });

  describe('checkInVisitor', () => {
    it('should forward checkIn to visitorsService', async () => {
      const dto = { gateId: 'g-1' } as any;
      mockVisitorsService.checkInVisitor.mockResolvedValueOnce({ visitor: { id: 'vis-1' } });

      const res = await controller.checkInVisitor(dummyUser, 'vis-1', dto);

      expect(res.visitor.id).toBe('vis-1');
      expect(mockVisitorsService.checkInVisitor).toHaveBeenCalledWith(dummyUser, 'vis-1', dto);
    });
  });

  describe('createIncident', () => {
    it('should allow guard or resident to log security incident', async () => {
      const dto = { title: 'Fire alarm tripped', gateId: 'g-1' } as any;
      mockVisitorsService.createIncident.mockResolvedValueOnce({ id: 'inc-1' });

      const res = await controller.createIncident(dummyUser, dto);

      expect(res.id).toBe('inc-1');
      expect(mockVisitorsService.createIncident).toHaveBeenCalledWith(dummyUser, dto);
    });
  });
});
