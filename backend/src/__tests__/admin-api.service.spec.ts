import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from '../admin/admin.service';
import { User } from '../users/entities/user.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Trip } from '../trips/entities/trip.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { SosAlert } from '../safety/entities/sos-alert.entity';
import { IncidentReport } from '../safety/entities/incident-report.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

describe('AdminService', () => {
  let service: AdminService;

  const repo = (extra = {}) => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({}),
    }),
    ...extra,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: repo() },
        { provide: getRepositoryToken(Offer), useValue: repo() },
        { provide: getRepositoryToken(Trip), useValue: repo() },
        { provide: getRepositoryToken(SupportTicket), useValue: repo() },
        { provide: getRepositoryToken(SosAlert), useValue: repo() },
        { provide: getRepositoryToken(IncidentReport), useValue: repo() },
        { provide: getRepositoryToken(AuditLog), useValue: repo() },
      ],
    }).compile();
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('getDashboardStats returns expected shape', async () => {
    const stats = await service.getDashboardStats();
    expect(stats).toHaveProperty('totalUsers');
    expect(stats).toHaveProperty('totalTrips');
    expect(stats).toHaveProperty('completionRate');
    expect(stats).toHaveProperty('openSos');
    expect(stats).toHaveProperty('openTickets');
  });

  it('listUsers returns array', async () => {
    const result = await service.listUsers({ page: 1, search: '' });
    expect(Array.isArray(result)).toBe(true);
  });
});
