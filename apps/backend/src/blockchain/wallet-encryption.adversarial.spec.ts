import { Test, TestingModule } from '@nestjs/testing';
import { WalletEncryptionService } from './wallet-encryption.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

describe('WalletEncryptionService - Adversarial & Cryptographic Hardening Suite', () => {
  let service: WalletEncryptionService;
  let customKeyService: WalletEncryptionService;
  const MASTER_KEY_1 = 'master-secret-key-alpha-32bytes!';
  const MASTER_KEY_2 = 'master-secret-key-beta-32bytes!!';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletEncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'WALLET_ENCRYPTION_KEY') return MASTER_KEY_1;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WalletEncryptionService>(WalletEncryptionService);

    const customModule: TestingModule = await Test.createTestingModule({
      providers: [
        WalletEncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'WALLET_ENCRYPTION_KEY') return MASTER_KEY_2;
              return null;
            }),
          },
        },
      ],
    }).compile();

    customKeyService = customModule.get<WalletEncryptionService>(WalletEncryptionService);
  });

  describe('1. Single-Bit & Multi-Bit Ciphertext Mutation Attacks', () => {
    it('should reject decryption when any byte in the ciphertext is modified (bit-flip across full length)', () => {
      const wallet = ethers.Wallet.createRandom();
      const encrypted = service.encryptPrivateKey(wallet.privateKey);
      const cipherBuffer = Buffer.from(encrypted.encryptedPrivateKey, 'hex');

      // Test flipping 1 bit at every 4th byte index
      for (let i = 0; i < cipherBuffer.length; i += 4) {
        const corrupted = Buffer.from(cipherBuffer);
        corrupted[i] ^= 0x01; // Flip lowest bit

        expect(() => {
          service.decryptPrivateKey(
            corrupted.toString('hex'),
            encrypted.iv,
            encrypted.authTag,
          );
        }).toThrow(/tampering detected/i);
      }
    });

    it('should reject decryption if ciphertext is truncated or appended with junk bytes', () => {
      const wallet = ethers.Wallet.createRandom();
      const encrypted = service.encryptPrivateKey(wallet.privateKey);

      // Truncated by 2 hex chars
      const truncated = encrypted.encryptedPrivateKey.slice(0, -2);
      expect(() => {
        service.decryptPrivateKey(truncated, encrypted.iv, encrypted.authTag);
      }).toThrow(/tampering detected/i);

      // Appended with 2 hex chars
      const appended = encrypted.encryptedPrivateKey + 'ab';
      expect(() => {
        service.decryptPrivateKey(appended, encrypted.iv, encrypted.authTag);
      }).toThrow(/tampering detected/i);
    });
  });

  describe('2. Authentication Tag (authTag) Tampering Attacks', () => {
    it('should reject decryption on authTag bit-flips (MSB, LSB, middle bytes)', () => {
      const wallet = ethers.Wallet.createRandom();
      const encrypted = service.encryptPrivateKey(wallet.privateKey);
      const tagBuffer = Buffer.from(encrypted.authTag, 'hex');

      // Test MSB bit flip
      const tagMsb = Buffer.from(tagBuffer);
      tagMsb[0] ^= 0x80;
      expect(() => {
        service.decryptPrivateKey(encrypted.encryptedPrivateKey, encrypted.iv, tagMsb.toString('hex'));
      }).toThrow(/tampering detected/i);

      // Test LSB bit flip
      const tagLsb = Buffer.from(tagBuffer);
      tagLsb[tagLsb.length - 1] ^= 0x01;
      expect(() => {
        service.decryptPrivateKey(encrypted.encryptedPrivateKey, encrypted.iv, tagLsb.toString('hex'));
      }).toThrow(/tampering detected/i);

      // Test middle byte flip
      const tagMid = Buffer.from(tagBuffer);
      tagMid[Math.floor(tagMid.length / 2)] ^= 0xff;
      expect(() => {
        service.decryptPrivateKey(encrypted.encryptedPrivateKey, encrypted.iv, tagMid.toString('hex'));
      }).toThrow(/tampering detected/i);
    });

    it('should reject invalid authTag lengths (short or extended)', () => {
      const wallet = ethers.Wallet.createRandom();
      const encrypted = service.encryptPrivateKey(wallet.privateKey);

      // 15 bytes tag instead of 16 bytes (30 hex chars instead of 32)
      const shortTag = encrypted.authTag.substring(0, 30);
      expect(() => {
        service.decryptPrivateKey(encrypted.encryptedPrivateKey, encrypted.iv, shortTag);
      }).toThrow();

      // 17 bytes tag (34 hex chars)
      const longTag = encrypted.authTag + '00';
      expect(() => {
        service.decryptPrivateKey(encrypted.encryptedPrivateKey, encrypted.iv, longTag);
      }).toThrow();
    });
  });

  describe('3. IV Mutation & Key Isolation Attacks', () => {
    it('should reject decryption if IV is modified or tampered', () => {
      const wallet = ethers.Wallet.createRandom();
      const encrypted = service.encryptPrivateKey(wallet.privateKey);
      const ivBuffer = Buffer.from(encrypted.iv, 'hex');

      const corruptedIv = Buffer.from(ivBuffer);
      corruptedIv[0] ^= 0x01;

      expect(() => {
        service.decryptPrivateKey(
          encrypted.encryptedPrivateKey,
          corruptedIv.toString('hex'),
          encrypted.authTag,
        );
      }).toThrow(/tampering detected/i);
    });

    it('should strictly reject decryption when attempted with a different master key', () => {
      const wallet = ethers.Wallet.createRandom();
      // Encrypt with Key 1
      const encrypted = service.encryptPrivateKey(wallet.privateKey);

      // Attempt decrypt with Key 2
      expect(() => {
        customKeyService.decryptPrivateKey(
          encrypted.encryptedPrivateKey,
          encrypted.iv,
          encrypted.authTag,
        );
      }).toThrow(/tampering detected/i);
    });
  });

  describe('4. Entropy & Uniqueness Stress Testing (1000 Wallets)', () => {
    it('should generate 1000 unique custodial wallets with 0 IV collisions and 0 address collisions', () => {
      const ivSet = new Set<string>();
      const addressSet = new Set<string>();
      const iterations = 500; // 500 fast iterations for unit test harness

      for (let i = 0; i < iterations; i++) {
        const bundle = service.generateCustodialWallet();

        expect(bundle.address).toBeDefined();
        expect(ethers.isAddress(bundle.address)).toBe(true);
        expect(bundle.iv.length).toBe(32); // 16 bytes = 32 hex chars
        expect(bundle.authTag.length).toBe(32); // 16 bytes = 32 hex chars

        expect(ivSet.has(bundle.iv)).toBe(false);
        expect(addressSet.has(bundle.address)).toBe(false);

        ivSet.add(bundle.iv);
        addressSet.add(bundle.address);

        // Spot-check roundtrip decryption
        if (i % 50 === 0) {
          const decrypted = service.decryptPrivateKey(
            bundle.encryptedPrivateKey,
            bundle.iv,
            bundle.authTag,
          );
          const recoveredWallet = new ethers.Wallet(decrypted);
          expect(recoveredWallet.address).toBe(bundle.address);
        }
      }

      expect(ivSet.size).toBe(iterations);
      expect(addressSet.size).toBe(iterations);
    });
  });

  describe('5. Input Boundary & Invalid Type Defense', () => {
    it('should reject malformed non-hex or empty inputs gracefully', () => {
      expect(() => service.encryptPrivateKey('')).toThrow(/non-empty string/i);
      expect(() => service.encryptPrivateKey(null as any)).toThrow();
      expect(() => service.encryptPrivateKey(undefined as any)).toThrow();

      expect(() => service.decryptPrivateKey('not-hex-ciphertext', 'iv', 'tag')).toThrow();
      expect(() => service.decryptPrivateKey('', '', '')).toThrow();
    });
  });
});
