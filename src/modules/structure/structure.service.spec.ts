import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { StructureService } from './structure.service';
import { Tower } from './entities/tower.entity';
import { Floor } from './entities/floor.entity';
import { Unit } from './entities/unit.entity';
import { SocietiesService } from '../societies/societies.service';
import { UnitType } from '../../common/enums/unit-type.enum';

describe('StructureService', () => {
  let service: StructureService;

  const mockTowersRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockFloorsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockUnitsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    manager: {
      transaction: jest.fn(async (cb) => cb({
        save: jest.fn(async (cls, items) => items),
        createQueryBuilder: () => ({
          update: () => ({
            set: () => ({
              where: () => ({
                execute: jest.fn(),
              }),
            }),
          }),
        }),
      })),
    },
  };

  const mockSocietiesService = {
    incrementTowerCount: jest.fn(),
    decrementTowerCount: jest.fn(),
    incrementUnitCount: jest.fn(),
    decrementUnitCount: jest.fn(),
  };

  const societyId = 'soc-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StructureService,
        { provide: getRepositoryToken(Tower), useValue: mockTowersRepo },
        { provide: getRepositoryToken(Floor), useValue: mockFloorsRepo },
        { provide: getRepositoryToken(Unit), useValue: mockUnitsRepo },
        { provide: SocietiesService, useValue: mockSocietiesService },
      ],
    }).compile();

    service = module.get<StructureService>(StructureService);
  });

  describe('Towers', () => {
    it('should create tower and increment society tower count (happy path)', async () => {
      const mockTower = { id: 'tow-1', name: 'Tower A', societyId };
      mockTowersRepo.create.mockReturnValue(mockTower);
      mockTowersRepo.save.mockResolvedValue(mockTower);

      const res = await service.createTower(societyId, { name: 'Tower A' });

      expect(res.id).toBe('tow-1');
      expect(mockSocietiesService.incrementTowerCount).toHaveBeenCalledWith(societyId);
    });

    it('should throw NotFoundException if tower not found in society (tenant isolation)', async () => {
      mockTowersRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOneTower(societyId, 'tow-other')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Floors & Units (Parent Ownership Validation)', () => {
    it('should verify parent tower belongs to society before creating floor', async () => {
      mockTowersRepo.findOne.mockResolvedValueOnce(null); // tower doesn't exist in society

      await expect(
        service.createFloor(societyId, 'tow-foreign', { floorNumber: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create unit when floor and tower are verified within society', async () => {
      mockTowersRepo.findOne.mockResolvedValueOnce({ id: 'tow-1', societyId });
      mockFloorsRepo.findOne.mockResolvedValueOnce({ id: 'fl-1', towerId: 'tow-1', societyId });
      mockUnitsRepo.findOne.mockResolvedValueOnce(null); // unit doesn't exist

      const mockCreatedUnit = { id: 'u-101', unitNumber: '101', type: UnitType.TWO_BHK };
      mockUnitsRepo.create.mockReturnValue(mockCreatedUnit);
      mockUnitsRepo.save.mockResolvedValue(mockCreatedUnit);

      const res = await service.createUnit(societyId, 'tow-1', 'fl-1', {
        unitNumber: '101',
        type: UnitType.TWO_BHK,
      });

      expect(res.id).toBe('u-101');
      expect(mockUnitsRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if unit number already exists in tower', async () => {
      mockTowersRepo.findOne.mockResolvedValueOnce({ id: 'tow-1', societyId });
      mockFloorsRepo.findOne.mockResolvedValueOnce({ id: 'fl-1', towerId: 'tow-1', societyId });
      mockUnitsRepo.findOne.mockResolvedValueOnce({ id: 'u-dup', unitNumber: '101' });

      await expect(
        service.createUnit(societyId, 'tow-1', 'fl-1', {
          unitNumber: '101',
          type: UnitType.TWO_BHK,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
