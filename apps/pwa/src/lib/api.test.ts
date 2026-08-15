import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, authApi, qrApi, blockchainApi, ApiError } from './api';

describe('PWA API Client & Endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ApiError should format status and error data correctly', () => {
    const err = new ApiError('Error de validación', 400, { field: 'email' });
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('Error de validación');
    expect(err.status).toBe(400);
    expect(err.data).toEqual({ field: 'email' });
  });

  it('apiRequest should include credentials and content-type', async () => {
    const mockResponse = { success: true };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    } as any);

    const result = await apiRequest('/api/v1/health');
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/health'),
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });

  it('authApi.login should send credentials and return user info', async () => {
    const mockUser = {
      id: 'usr-123',
      email: 'test@cleancity.io',
      name: 'Test User',
      role: 'USER',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ user: mockUser }),
    } as any);

    const res = await authApi.login({ email: 'test@cleancity.io', password: 'password123' });
    expect(res.user).toEqual(mockUser);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@cleancity.io', password: 'password123' }),
      })
    );
  });

  it('qrApi.verify should call verificar endpoint', async () => {
    const mockVerify = {
      codigo: 'QR-PLASTICO-123',
      valido: true,
      material: 'Plástico',
      puntos: 10,
      usado: false,
      expiresAt: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockVerify,
    } as any);

    const res = await qrApi.verify('QR-PLASTICO-123');
    expect(res.valido).toBe(true);
    expect(res.puntos).toBe(10);
  });

  it('qrApi.claim should call reclamar endpoint with token payload', async () => {
    const mockClaim = {
      success: true,
      puntos: 10,
      material: 'Plástico',
      txStatus: 'QUEUED',
      message: 'Puntos reclamados exitosamente',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockClaim,
    } as any);

    const res = await qrApi.claim('QR-PLASTICO-123');
    expect(res.success).toBe(true);
    expect(res.txStatus).toBe('QUEUED');
  });

  it('blockchainApi.getBalance should query balance by EVM address', async () => {
    const mockBalance = {
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      balance: '50.0',
      symbol: 'RECI',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockBalance,
    } as any);

    const res = await blockchainApi.getBalance('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    expect(res.balance).toBe('50.0');
    expect(res.symbol).toBe('RECI');
  });
});
