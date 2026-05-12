import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripsService } from '../trips/trips.service';
import { Trip } from '../trips/entities/trip.entity';
import { RideRequest } from '../requests/entities/ride-request.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('TripsService', () => {
  let service: TripsService;

  const mockTripRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRequestRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockNotif = { send: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: getRepositoryToken(Trip), useValue: mockTripRepo },
        { provide: getRepositoryToken(RideRequest), useValue: mockRequestRepo },
        { provide: NotificationsService, useValue: mockNotif },
      ],
    }).compile();
    service = module.get<TripsService>(TripsService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('findAll returns array for user', async () => {
    const result = await service.findAll('u1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('complete sets status to Completed', async () => {
    const trip = { id: 't1', status: 'InProgress', ownerId: 'u1', riderId: 'u2' };
    mockTripRepo.findOne.mockResolvedValue(trip);
    mockTripRepo.save.mockResolvedValue({ ...trip, status: 'Completed', completedAt: new Date() });
    const result = await service.complete('t1', 'u1');
    expect(result.status).toBe('Completed');
  });
});
