import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { WalletEncryptionService } from '../blockchain/wallet-encryption.service';
import { JwtStrategy } from './jwt.strategy';
import { StationTokenGuard } from './guards/station-token.guard';
import { RolesGuard } from './guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('Auth & Session Security - Adversarial & Stress Testing', () => {
  let authService: AuthService;
  let jwtStrategy: JwtStrategy;
  let stationTokenGuard: StationTokenGuard;
  let rolesGuard: RolesGuard;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let reflector: Reflector;

  const mockSecret = 'cleancity-test-secret-key-32chars!';
  const wrongSecret = 'attacker-forged-secret-key-999!';

  const mockUserRecord = {
    id: 'user-adversarial-01',
    email: 'citizen@recicla.com',
    password: '$2b$10$e8wFvUj.4pScmfL9k.vTNu78a1zPq2BwXq.7e8e9r0t1y2u3i4o5p',
    name: 'Ciudadano Ejemplar',
    role: Role.USER,
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    encryptedPrivateKey: '0xmockencryptedkey123',
    iv: 'mock_iv_hex',
    authTag: 'mock_auth_tag_hex',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = mockSecret;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtStrategy,
        StationTokenGuard,
        RolesGuard,
        Reflector,
        {
          provide: JwtService,
          useValue: new JwtService({ secret: mockSecret }),
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            station: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: WalletEncryptionService,
          useValue: {
            generateCustodialWallet: jest.fn().mockReturnValue({
              address: '0x9999888877776666555544443333222211110000',
              encryptedPrivateKey: 'enc_private_key_gcm',
              iv: 'iv_gcm_12bytes',
              authTag: 'auth_tag_16bytes',
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    stationTokenGuard = module.get<StationTokenGuard>(StationTokenGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('1. JWT Tampering, Signature Forgery & Expiration Defense', () => {
    it('should reject JWT tokens signed with a forged or rogue secret', async () => {
      const rogueJwtService = new JwtService({ secret: wrongSecret });
      const forgedToken = rogueJwtService.sign({
        sub: 'user-adversarial-01',
        email: 'citizen@recicla.com',
      });

      expect(() => {
        jwtService.verify(forgedToken);
      }).toThrow();
    });

    it('should reject expired JWT tokens past their exp timestamp', async () => {
      const expiredToken = jwtService.sign(
        { sub: 'user-adversarial-01', email: 'citizen@recicla.com' },
        { expiresIn: '-10s' },
      );

      expect(() => {
        jwtService.verify(expiredToken);
      }).toThrow();
    });

    it('should reject tampered JWT payloads where payload body was modified without resigning', () => {
      const validToken = jwtService.sign({
        sub: 'user-adversarial-01',
        email: 'citizen@recicla.com',
      });

      const parts = validToken.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({ sub: 'user-adversarial-01', email: 'admin@recicla.com', role: 'ADMIN' }),
      ).toString('base64url');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      expect(() => {
        jwtService.verify(tamperedToken);
      }).toThrow();
    });

    it('JwtStrategy.validate should throw UnauthorizedException if user ID does not exist in DB', async () => {
      (jest.spyOn(prisma.user, 'findUnique') as any).mockResolvedValue(null);

      await expect(
        jwtStrategy.validate({ sub: 'deleted-user-uuid', email: 'ghost@recicla.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('JwtStrategy.validate should return sanitized user without password or private keys', async () => {
      (jest.spyOn(prisma.user, 'findUnique') as any).mockResolvedValue({
        id: mockUserRecord.id,
        email: mockUserRecord.email,
        name: mockUserRecord.name,
        role: mockUserRecord.role,
        walletAddress: mockUserRecord.walletAddress,
      });

      const validated = await jwtStrategy.validate({
        sub: mockUserRecord.id,
        email: mockUserRecord.email,
      });

      expect(validated.id).toBe(mockUserRecord.id);
      expect(validated.email).toBe(mockUserRecord.email);
      expect((validated as any).password).toBeUndefined();
      expect((validated as any).encryptedPrivateKey).toBeUndefined();
    });
  });

  describe('2. Cookie & Bearer Header Token Extraction Mechanisms', () => {
    it('should extract JWT from cookies when present', () => {
      const mockReq: any = {
        cookies: {
          access_token: 'cookie_jwt_token_value',
        },
        headers: {},
      };

      const extracted = (jwtStrategy as any)._jwtFromRequest(mockReq);
      expect(extracted).toBe('cookie_jwt_token_value');
    });

    it('should fallback to Authorization Bearer header when cookie is absent', () => {
      const mockReq: any = {
        cookies: {},
        headers: {
          authorization: 'Bearer header_jwt_token_value',
        },
      };

      const extracted = (jwtStrategy as any)._jwtFromRequest(mockReq);
      expect(extracted).toBe('header_jwt_token_value');
    });

    it('should return null when neither cookie nor Bearer header is present', () => {
      const mockReq: any = {
        cookies: undefined,
        headers: {},
      };

      const extracted = (jwtStrategy as any)._jwtFromRequest(mockReq);
      expect(extracted).toBeNull();
    });
  });

  describe('3. StationTokenGuard Adversarial Testing', () => {
    it('should throw UnauthorizedException when X-Station-Token header is missing', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(
        stationTokenGuard.canActivate(mockContext),
      ).rejects.toThrow(new UnauthorizedException('Missing X-Station-Token header'));
    });

    it('should throw UnauthorizedException when X-Station-Token is invalid or not in DB', async () => {
      (jest.spyOn(prisma.station, 'findUnique') as any).mockResolvedValue(null);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-station-token': 'rogue_station_token',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(
        stationTokenGuard.canActivate(mockContext),
      ).rejects.toThrow(new UnauthorizedException('Invalid Station Token'));
    });

    it('should allow access and attach station entity when X-Station-Token is valid', async () => {
      const mockStation = {
        id: 'station-01',
        token: 'valid_hw_token_123',
        name: 'Estación 1',
      };
      (jest.spyOn(prisma.station, 'findUnique') as any).mockResolvedValue(mockStation);

      const reqObj: any = {
        headers: {
          'x-station-token': 'valid_hw_token_123',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => reqObj,
        }),
      } as unknown as ExecutionContext;

      const canActivate = await stationTokenGuard.canActivate(mockContext);
      expect(canActivate).toBe(true);
      expect(reqObj.station).toEqual(mockStation);
    });
  });

  describe('4. RolesGuard RBAC Authorization Testing', () => {
    it('should deny access when user role does not match required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockContext = {
        getHandler: () => () => {},
        getClass: () => class {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'u1', role: Role.USER },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = rolesGuard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should allow access when user role matches required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockContext = {
        getHandler: () => () => {},
        getClass: () => class {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'admin1', role: Role.ADMIN },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = rolesGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow access when no roles are required for endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const mockContext = {
        getHandler: () => () => {},
        getClass: () => class {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'u1', role: Role.USER },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = rolesGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});
