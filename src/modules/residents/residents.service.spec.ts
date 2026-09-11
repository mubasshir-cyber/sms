import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { Resident } from './entities/resident.entity';
import { FamilyMember } from './entities/family-member.entity';
import { StructureService } from '../structure/structure.service';
import { ResidentType } from '../../common/enums/resident-type.enum';
import { UnitStatus } from '../../common/enums/unit-type.enum';

describe('ResidentsService', () => {
  let service: ResidentsService;

  const mockResidentsRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFamilyRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockStructureService = {
    findOneUnit: jest.fn(),
    updateUnit: jest.fn(),
  };

  const societyId = 'soc-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidentsService,
        { provide: getRepositoryToken(Resident), useValue: mockResidentsRepo },
        { provide: getRepositoryToken(FamilyMember), useValue: mockFamilyRepo },
        { provide: StructureService, useValue: mockStructureService },
      ],
    }).compile();

    service = module.get<ResidentsService>(ResidentsService);
  });

  describe('create', () => {
    it('should create resident and mark unit as OCCUPIED (happy path)', async () => {
      mockStructureService.findOneUnit.mockResolvedValueOnce({ id: 'unit-1', societyId });
      mockResidentsRepo.findOne.mockResolvedValueOnce(null); // not duplicate
      const mockResident = { id: 'res-1', societyId, unitId: 'unit-1', userId: 'u-1' };
      mockResidentsRepo.create.mockReturnValue(mockResident);
      mockResidentsRepo.save.mockResolvedValue(mockResident);

      const dto = {
        userId: 'u-1',
        unitId: 'unit-1',
        type: ResidentType.OWNER,
      };

      const result = await service.create(societyId, dto as any);

      expect(result.id).toBe('res-1');
      expect(mockStructureService.updateUnit).toHaveBeenCalledWith(
        societyId,
        'unit-1',
        expect.objectContaining({ status: UnitStatus.OCCUPIED, ownerUserId: 'u-1' }),
      );
    });

    it('should throw ConflictException if user is already a resident in this society', async () => {
      mockStructureService.findOneUnit.mockResolvedValueOnce({ id: 'unit-1', societyId });
      mockResidentsRepo.findOne.mockResolvedValueOnce({ id: 'res-existing' });

      const dto = {
        userId: 'u-1',
        unitId: 'unit-1',
        type: ResidentType.OWNER,
      };

      await expect(service.create(societyId, dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('Family Members (Child Resource Ownership)', () => {
    it('should verify resident belongs to society before adding family member', async () => {
      mockResidentsRepo.findOne.mockResolvedValueOnce(null); // resident not found in society

      const dto = { name: 'Alice Doe', relation: 'Spouse' };

      await expect(
        service.addFamilyMember(societyId, 'res-foreign', dto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add family member when parent resident is verified in society', async () => {
      mockResidentsRepo.findOne.mockResolvedValueOnce({ id: 'res-1', societyId });
      const mockMember = { id: 'fm-1', residentId: 'res-1', name: 'Alice Doe' };
      mockFamilyRepo.create.mockReturnValue(mockMember);
      mockFamilyRepo.save.mockResolvedValue(mockMember);

      const dto = { name: 'Alice Doe', relation: 'Spouse' };

      const res = await service.addFamilyMember(societyId, 'res-1', dto as any);

      expect(res.id).toBe('fm-1');
      expect(mockFamilyRepo.save).toHaveBeenCalled();
    });
  });
});
