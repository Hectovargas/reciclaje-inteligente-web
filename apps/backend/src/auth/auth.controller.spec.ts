import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@recicla.com',
    name: 'Usuario Test',
    role: Role.USER,
    walletAddress: '0x1234567890123456789012345678901234567890',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
              access_token: 'mock_token',
              user: mockUser,
            }),
            register: jest.fn().mockResolvedValue({
              access_token: 'mock_token',
              user: mockUser,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register user, set cookie and return user payload', async () => {
      const mockRes = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.register(
        { email: 'test@recicla.com', password: 'password123', name: 'Usuario Test' },
        mockRes,
      );

      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@recicla.com',
        password: 'password123',
        name: 'Usuario Test',
      });
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.walletAddress).toBe(mockUser.walletAddress);
    });
  });

  describe('login', () => {
    it('should login user, set cookie and return user payload', async () => {
      const mockRes = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.login(
        { email: 'test@recicla.com', password: 'password123' },
        mockRes,
      );

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@recicla.com',
        password: 'password123',
      });
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });
  });

  describe('logout', () => {
    it('should clear access_token cookie', () => {
      const mockRes = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      const result = controller.logout(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          httpOnly: true,
        }),
      );
      expect(result).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('getProfile', () => {
    it('should return profile from request user', () => {
      const mockReq = {
        user: mockUser,
      } as unknown as Request;

      const result = controller.getProfile(mockReq);
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });
  });
});
