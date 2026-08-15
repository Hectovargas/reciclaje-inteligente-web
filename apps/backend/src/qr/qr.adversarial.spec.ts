import { Test, TestingModule } from '@nestjs/testing';
import { QrService } from './qr.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { BlockchainEventStatus } from '@prisma/client';
import { ethers } from 'ethers';

describe('QrService - Adversarial & Stress Testing', () => {
  let service: QrService;
  let prisma: PrismaService;

  const mockAttackerWallet = ethers.Wallet.createRandom();

  const createMockQrRecord = (overrides = {}) => ({
    id: 'qr-uuid-test-01',
    codigo: 'QR-PLASTICO-1723680000-deadbeef',
    categoria: 'Plástico',
    firma: '0x' + '1'.repeat(130),
    usado: false,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrService,
        {
          provide: PrismaService,
          useValue: {
            qRToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            blockchainEvent: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QrService>(QrService);
    prisma = module.get<PrismaService>(PrismaService);
    await service.onModuleInit();
  });

  describe('1. Cryptographic Generation, ECDSA Verification & Forgery Defense', () => {
    it('should generate verifiable ECDSA signatures recoverable to the operator public address', async () => {
      const capturedTokens: any[] = [];
      (jest.spyOn(prisma.qRToken, 'create') as any).mockImplementation(async (args: any) => {
        capturedTokens.push(args.data);
        return { id: 'qr-gen-1', ...args.data };
      });

      const qr = await service.generarQR('Vidrio', 'station-nord-01', 2);

      expect(qr.codigo).toMatch(/^QR-VIDRIO-\d+-[a-f0-9]{8}$/);
      expect(qr.firma).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(qr.puntos).toBe(16); // Vidrio base 8 * 2 = 16

      // Reconstruct payload and verify ECDSA signature recovery
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'string', 'string'],
        [qr.codigo, 'Vidrio', qr.timestamp],
      );

      const recoveredSigner = ethers.verifyMessage(ethers.getBytes(messageHash), qr.firma);
      expect(recoveredSigner.toLowerCase()).toBe(service.getOperatorAddress().toLowerCase());
    });

    it('should detect and reject signature forgery generated with an unauthorized private key', async () => {
      const genuineToken = createMockQrRecord({
        categoria: 'Metal',
        firma: '0x' + 'a'.repeat(130),
      });
      (jest.spyOn(prisma.qRToken, 'findUnique') as any).mockResolvedValue(genuineToken);

      // Attacker signs genuine token hash with attacker's own private key
      const forgedSignature = await mockAttackerWallet.signMessage(
        ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes('forged-payload'))),
      );

      await expect(
        service.verificarQR(genuineToken.codigo, forgedSignature),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject malformed or truncated signatures with BadRequestException', async () => {
      const genuineToken = createMockQrRecord();
      (jest.spyOn(prisma.qRToken, 'findUnique') as any).mockResolvedValue(genuineToken);

      await expect(
        service.verificarQR(genuineToken.codigo, '0xdeadbeef_truncated_invalid_sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate completely unique codes and distinct signatures for rapid sequential calls', async () => {
      const generatedCodes = new Set<string>();
      const generatedSignatures = new Set<string>();

      (jest.spyOn(prisma.qRToken, 'create') as any).mockImplementation(async (args: any) => {
        return { id: `id-${Math.random()}`, ...args.data };
      });

      for (let i = 0; i < 25; i++) {
        const res = await service.generarQR('Plástico', 'st-01', 1);
        expect(generatedCodes.has(res.codigo)).toBe(false);
        expect(generatedSignatures.has(res.firma)).toBe(false);
        generatedCodes.add(res.codigo);
        generatedSignatures.add(res.firma);
      }

      expect(generatedCodes.size).toBe(25);
      expect(generatedSignatures.size).toBe(25);
    });
  });

  describe('2. Anti-Replay Defense & Concurrent Double-Claim Race Conditions', () => {
    it('should reject replay attacks when token was already redeemed (usado = true)', async () => {
      const alreadyClaimedToken = createMockQrRecord({ usado: true });

      const mockTx = {
        qRToken: {
          findUnique: jest.fn().mockResolvedValue(alreadyClaimedToken),
          update: jest.fn(),
        },
        blockchainEvent: { create: jest.fn() },
      };
      (jest.spyOn(prisma, '$transaction') as any).mockImplementation(async (cb: any) => cb(mockTx));

      const user = { id: 'user-attacker', email: 'attacker@evil.com' };

      await expect(
        service.reclamarQR(user, { codigo: alreadyClaimedToken.codigo }),
      ).rejects.toThrow(ConflictException);

      expect(mockTx.qRToken.update).not.toHaveBeenCalled();
      expect(mockTx.blockchainEvent.create).not.toHaveBeenCalled();
    });

    it('should simulate 10 concurrent claim race conditions on the same token with atomic isolation', async () => {
      let isTokenClaimed = false;

      (jest.spyOn(prisma, '$transaction') as any).mockImplementation(async (callback: any) => {
        const txPrisma = {
          qRToken: {
            findUnique: jest.fn().mockImplementation(async () => {
              const currentStatus = isTokenClaimed;
              return createMockQrRecord({ usado: currentStatus });
            }),
            update: jest.fn().mockImplementation(async () => {
              isTokenClaimed = true;
              return createMockQrRecord({ usado: true });
            }),
          },
          blockchainEvent: {
            create: jest.fn().mockResolvedValue({
              id: 'event-race-win',
              status: BlockchainEventStatus.PENDING,
              amount: 10,
            }),
          },
        };

        return callback(txPrisma);
      });

      const concurrentUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `user-concurrent-${i}`,
        email: `user${i}@domain.com`,
        walletAddress: `0x${i.toString().padStart(40, '0')}`,
      }));

      // Execute 10 claims sequentially in the transaction queue to simulate atomic DB serialization
      const results = [];
      for (const u of concurrentUsers) {
        try {
          const res = await service.reclamarQR(u, { codigo: 'QR-PLASTICO-1723680000-deadbeef' });
          results.push({ status: 'fulfilled', value: res });
        } catch (err) {
          results.push({ status: 'rejected', reason: err });
        }
      }

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly 1 request succeeds; the remaining 9 are rejected with ConflictException
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(9);
      rejected.forEach((r: any) => {
        expect(r.reason).toBeInstanceOf(ConflictException);
        expect((r.reason as ConflictException).message).toContain('ataque de repetición evitado');
      });
    });

    it('should rollback and preserve token state if blockchain event creation fails inside transaction', async () => {
      const token = createMockQrRecord({ usado: false });

      (jest.spyOn(prisma, '$transaction') as any).mockImplementation(async (cb: any) => {
        const mockTx = {
          qRToken: {
            findUnique: jest.fn().mockResolvedValue(token),
            update: jest.fn().mockResolvedValue({ ...token, usado: true }),
          },
          blockchainEvent: {
            create: jest.fn().mockRejectedValue(new Error('Postgres Connection Lost')),
          },
        };
        return cb(mockTx);
      });

      await expect(
        service.reclamarQR({ id: 'u1' }, { codigo: token.codigo }),
      ).rejects.toThrow('Postgres Connection Lost');
    });
  });

  describe('3. Expired QR & TTL Boundary Invalidation', () => {
    it('should reject verification if token expired exactly 1 ms ago', async () => {
      const expiredToken = createMockQrRecord({
        expiresAt: new Date(Date.now() - 1),
      });
      (jest.spyOn(prisma.qRToken, 'findUnique') as any).mockResolvedValue(expiredToken);

      await expect(
        service.verificarQR(expiredToken.codigo),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject claim if token expired', async () => {
      const expiredToken = createMockQrRecord({
        expiresAt: new Date(Date.now() - 600000), // 10 mins ago
      });

      const mockTx = {
        qRToken: {
          findUnique: jest.fn().mockResolvedValue(expiredToken),
          update: jest.fn(),
        },
        blockchainEvent: { create: jest.fn() },
      };
      (jest.spyOn(prisma, '$transaction') as any).mockImplementation(async (cb: any) => cb(mockTx));

      await expect(
        service.reclamarQR({ id: 'u1' }, { codigo: expiredToken.codigo }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should succeed verification if token is 5 seconds before expiration', async () => {
      const validToken = createMockQrRecord({
        expiresAt: new Date(Date.now() + 5000),
      });
      (jest.spyOn(prisma.qRToken, 'findUnique') as any).mockResolvedValue(validToken);

      const res = await service.verificarQR(validToken.codigo);
      expect(res.valido).toBe(true);
    });
  });

  describe('4. Malformed Payloads, Injections & Boundary Values', () => {
    it('should automatically unpack stringified OLED JSON payload from QR scanners in verificarQR', async () => {
      const genuineToken = createMockQrRecord({ codigo: 'QR-METAL-999-ABCD' });
      (jest.spyOn(prisma.qRToken, 'findUnique') as any).mockResolvedValue(genuineToken);

      const oledPayloadString = JSON.stringify({
        c: 'QR-METAL-999-ABCD',
        m: 'Metal',
        p: 15,
        exp: Date.now() + 600000,
        s: '0xsignature',
      });

      const res = await service.verificarQR(oledPayloadString);
      expect(res.codigo).toBe('QR-METAL-999-ABCD');
      expect(prisma.qRToken.findUnique).toHaveBeenCalledWith({
        where: { codigo: 'QR-METAL-999-ABCD' },
      });
    });

    it('should automatically unpack stringified OLED JSON payload from QR scanners in reclamarQR', async () => {
      const genuineToken = createMockQrRecord({ codigo: 'QR-CARTON-111-1234' });

      const mockTx = {
        qRToken: {
          findUnique: jest.fn().mockResolvedValue(genuineToken),
          update: jest.fn().mockResolvedValue({ ...genuineToken, usado: true }),
        },
        blockchainEvent: {
          create: jest.fn().mockResolvedValue({
            id: 'event-123',
            status: BlockchainEventStatus.PENDING,
            amount: 5,
          }),
        },
      };
      (jest.spyOn(prisma, '$transaction') as any).mockImplementation(async (cb: any) => cb(mockTx));

      const oledPayloadString = JSON.stringify({
        c: 'QR-CARTON-111-1234',
        m: 'Cartón',
        p: 5,
      });

      const res = await service.reclamarQR({ id: 'user-1' }, { codigo: oledPayloadString });
      expect(res.success).toBe(true);
      expect(mockTx.qRToken.findUnique).toHaveBeenCalledWith({
        where: { codigo: 'QR-CARTON-111-1234' },
      });
    });

    it('should handle corrupted JSON string starting with { gracefully by searching raw code', async () => {
      const corruptedJson = '{c: corrupted_json_without_quotes}';
      (jest.spyOn(prisma.qRToken, 'findUnique') as any).mockResolvedValue(null);

      await expect(service.verificarQR(corruptedJson)).rejects.toThrow(NotFoundException);
      expect(prisma.qRToken.findUnique).toHaveBeenCalledWith({
        where: { codigo: corruptedJson },
      });
    });

    it('should reject empty or missing QR code with BadRequestException', async () => {
      await expect(service.verificarQR('')).rejects.toThrow(BadRequestException);
      await expect(service.reclamarQR({ id: 'u1' }, { codigo: '' })).rejects.toThrow(BadRequestException);
    });

    it('should sanitize category and compute robust points under extreme weights and unicode characters', () => {
      // Normal weights
      expect(service.calcularPuntos('ALUMINIO', 3)).toBe(45); // 15 * 3
      expect(service.calcularPuntos('botellas pet', 2)).toBe(20); // 10 * 2
      expect(service.calcularPuntos('Vidrio Verde', 1)).toBe(8); // 8 * 1
      expect(service.calcularPuntos('Cartón Corrugado', 4)).toBe(20); // 5 * 4

      // Extreme weights
      expect(service.calcularPuntos('Metal', 0)).toBe(15); // fallback to peso 1
      expect(service.calcularPuntos('Metal', -5)).toBe(15); // fallback to peso 1
      expect(service.calcularPuntos('Metal', 1000)).toBe(15000);

      // Empty or unknown category defaults to base 10
      expect(service.calcularPuntos('', 1)).toBe(10);
      expect(service.calcularPuntos('Desconocido', 1)).toBe(10);
    });
  });
});
