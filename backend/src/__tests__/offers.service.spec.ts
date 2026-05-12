import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OffersService } from '../offers/offers.service';
import { Offer } from '../offers/entities/offer.entity';
import { CommuteProfile } from '../commute/entities/commute-profile.entity';

describe('OffersService', () => {
  let service: OffersService;

  const mockOfferRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockCommuteRepo = {
    findOne: jest.fn().mockResolvedValue({ homeAddress: 'Home', officeAddress: 'Office' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: getRepositoryToken(Offer), useValue: mockOfferRepo },
        { provide: getRepositoryToken(CommuteProfile), useValue: mockCommuteRepo },
      ],
    }).compile();
    service = module.get<OffersService>(OffersService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('findAll returns array', async () => {
    const result = await service.findAll({ ownerId: 'u1' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('create persists offer', async () => {
    const dto = { direction: 'HomeToOffice', offerDate: '2026-06-01', departureTime: '08:30', availableSeats: 2 };
    mockOfferRepo.create.mockReturnValue({ ...dto, ownerId: 'u1', status: 'Active' });
    mockOfferRepo.save.mockResolvedValue({ id: 'o1', ...dto, ownerId: 'u1', status: 'Active' });
    const result = await service.create('u1', dto as any);
    expect(result).toHaveProperty('id', 'o1');
    expect(mockOfferRepo.save).toHaveBeenCalled();
  });
});
