import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { Plan } from '../../common/enums/plan.enum';

describe('TenantsService', () => {
  let service: TenantsService;

  const mockTenantsRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: getRepositoryToken(Tenant), useValue: mockTenantsRepo },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  describe('create', () => {
    it('should create tenant successfully (happy path)', async () => {
      mockTenantsRepo.findOne.mockResolvedValue(null);
      const mockCreated = { id: 'ten-1', name: 'Apex Builders', slug: 'apex-builders' };
      mockTenantsRepo.create.mockReturnValue(mockCreated);
      mockTenantsRepo.save.mockResolvedValue(mockCreated);

      const dto = {
        name: 'Apex Builders',
        slug: 'apex-builders',
        contactEmail: 'apex@example.com',
        contactPhone: '9876543210',
        plan: Plan.BASIC,
      };

      const result = await service.create(dto);

      expect(result.id).toBe('ten-1');
      expect(mockTenantsRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockTenantsRepo.findOne.mockResolvedValueOnce({ id: 'ten-existing', slug: 'dup-slug' });

      const dto = {
        name: 'Dup Name',
        slug: 'dup-slug',
        contactEmail: 'new@example.com',
        contactPhone: '9876543210',
      };

      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('canAddSociety', () => {
    it('should allow adding society when current count is below maxSocieties', async () => {
      mockTenantsRepo.findOne.mockResolvedValueOnce({
        id: 'ten-1',
        isActive: true,
        maxSocieties: 5,
      });

      const allowed = await service.canAddSociety('ten-1', 3);
      expect(allowed).toBe(true);
    });

    it('should disallow adding society when current count reaches maxSocieties', async () => {
      mockTenantsRepo.findOne.mockResolvedValueOnce({
        id: 'ten-1',
        isActive: true,
        maxSocieties: 2,
      });

      const allowed = await service.canAddSociety('ten-1', 2);
      expect(allowed).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when tenant is missing', async () => {
      mockTenantsRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
