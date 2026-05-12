import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { OtpService } from '../auth/otp.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockOtp = {
    sendOtp: jest.fn().mockResolvedValue(undefined),
    verifyOtp: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: OtpService, useValue: mockOtp },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('requestOtp calls OtpService.sendOtp', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    mockUserRepo.create.mockReturnValue({ phone: '9000000001' });
    mockUserRepo.save.mockResolvedValue({ id: 'u1', phone: '9000000001' });
    await service.requestOtp('9000000001');
    expect(mockOtp.sendOtp).toHaveBeenCalledWith('9000000001');
  });

  it('verifyOtp returns tokens on success', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 'u1', phone: '9000000001', suspended: false });
    mockUserRepo.save.mockResolvedValue({ id: 'u1' });
    const result = await service.verifyOtp('9000000001', '123456');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('verifyOtp throws on invalid OTP', async () => {
    mockOtp.verifyOtp.mockResolvedValueOnce(false);
    mockUserRepo.findOne.mockResolvedValue({ id: 'u1', phone: '9000000001' });
    await expect(service.verifyOtp('9000000001', '000000')).rejects.toThrow();
  });
});
