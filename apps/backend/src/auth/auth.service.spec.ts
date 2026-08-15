import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

import { WalletEncryptionService } from '../blockchain/wallet-encryption.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let walletEncryptionService: WalletEncryptionService;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@recicla.com',
    password: '$2b$10$mockHashedPassword',
    name: 'Usuario Test',
    role: Role.USER,
    walletAddress: '0x1234567890123456789012345678901234567890',
    encryptedPrivateKey: '0xmockPrivateKey',
    iv: null,
    authTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_signed_jwt_token'),
          },
        },
        {
          provide: WalletEncryptionService,
          useValue: {
            generateCustodialWallet: jest.fn().mockReturnValue({
              address: '0xabcdef1234567890abcdef1234567890abcdef12',
              encryptedPrivateKey: 'mockEncryptedKey',
              iv: 'mockIv',
              authTag: 'mockAuthTag',
            }),
            encryptPrivateKey: jest.fn(),
            decryptPrivateKey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate and return user without sensitive fields when credentials match', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.validateUser('test@recicla.com', 'password123');
      expect(result).toBeDefined();
      expect(result.email).toBe('test@recicla.com');
      expect(result.password).toBeUndefined();
      expect(result.encryptedPrivateKey).toBeUndefined();
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@recicla.com', 'password123');
      expect(result).toBeNull();
    });

    it('should return null if password comparison fails', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      const result = await service.validateUser('test@recicla.com', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info on valid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        walletAddress: mockUser.walletAddress,
      });

      const result = await service.login({
        email: 'test@recicla.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token', 'mock_signed_jwt_token');
      expect(result.user.email).toBe('test@recicla.com');
    });

    it('should throw UnauthorizedException if validateUser returns null', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({
          email: 'test@recicla.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user, create custodial wallet and return token with user info', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2b$10$newHashedPassword');
      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@recicla.com',
        name: 'New User',
        role: Role.USER,
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.register({
        email: 'newuser@recicla.com',
        password: 'password123',
        name: 'New User',
      });

      expect(result).toHaveProperty('access_token', 'mock_signed_jwt_token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@recicla.com');
      expect(result.user.role).toBe(Role.USER);
      expect(result.user.walletAddress).toBeDefined();
      expect(result.user.walletAddress.startsWith('0x')).toBe(true);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already registered', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.register({
          email: 'test@recicla.com',
          password: 'password123',
          name: 'Existing User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
