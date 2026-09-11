import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SocietiesService } from './societies.service';
import { Society } from './entities/society.entity';
import { TenantsService } from '../tenants/tenants.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('SocietiesService', () => {
  let service: SocietiesService;

  const mockSocietiesRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockTenantsService = {
    findOne: jest.fn().mockResolvedValue({ id: 'ten-1', isActive: true }),
    canAddSociety: jest.fn(),
  };

  const superUser: AuthUser = {
    sub: 'super-1',
    email: 'super@sms.com',
    role: Role.SUPER_ADMIN,
    societyId: null,
    iat: 0,
    exp: 0,
  };

  const adminUser: AuthUser = {
    sub: 'admin-1',
    email: 'admin@greenvalley.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-1',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTenantsService.findOne.mockResolvedValue({ id: 'ten-1', isActive: true });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocietiesService,
        { provide: getRepositoryToken(Society), useValue: mockSocietiesRepo },
        { provide: TenantsService, useValue: mockTenantsService },
      ],
    }).compile();

    service = module.get<SocietiesService>(SocietiesService);
  });

  describe('create', () => {
    it('should create a society when tenant quota is available (happy path)', async () => {
      mockSocietiesRepo.count.mockResolvedValueOnce(1); // 1 existing
      mockTenantsService.canAddSociety.mockResolvedValueOnce(true);
      mockSocietiesRepo.findOne.mockResolvedValueOnce(null); // slug available
      const mockCreated = { id: 'soc-new', name: 'Green Valley', slug: 'green-valley' };
      mockSocietiesRepo.create.mockReturnValue(mockCreated);
      mockSocietiesRepo.save.mockResolvedValue(mockCreated);

      const dto = {
        name: 'Green Valley',
        slug: 'green-valley',
        tenantId: 'ten-1',
        address: { addressLine1: '123 Main St', city: 'Bengaluru', state: 'KA', pincode: '560001' },
      };

      const result = await service.create(dto as any, superUser);

      expect(result.id).toBe('soc-new');
      expect(mockSocietiesRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if tenant maxSocieties quota is exceeded', async () => {
      mockSocietiesRepo.count.mockResolvedValueOnce(3);
      mockTenantsService.canAddSociety.mockResolvedValueOnce(false); // quota full

      const dto = {
        name: 'Extra Society',
        slug: 'extra-soc',
        tenantId: 'ten-1',
      };

      await expect(service.create(dto as any, superUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockSocietiesRepo.count.mockResolvedValueOnce(1);
      mockTenantsService.canAddSociety.mockResolvedValueOnce(true);
      mockSocietiesRepo.findOne.mockResolvedValueOnce({ id: 'soc-existing', slug: 'dup-slug' });

      const dto = {
        name: 'Dup Society',
        slug: 'dup-slug',
        tenantId: 'ten-1',
      };

      await expect(service.create(dto as any, superUser)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne & tenant isolation', () => {
    it('should allow regular society admin to access their own society', async () => {
      mockSocietiesRepo.findOne.mockResolvedValueOnce({ id: 'soc-1', name: 'Green Valley' });

      const result = await service.findOne('soc-1', adminUser);

      expect(result.id).toBe('soc-1');
    });

    it('should reject access if society admin attempts to access another society (tenant isolation)', async () => {
      mockSocietiesRepo.findOne.mockResolvedValueOnce({ id: 'soc-other', name: 'Other Society' });

      await expect(service.findOne('soc-other', adminUser)).rejects.toThrow(ForbiddenException);
    });
  });
});
