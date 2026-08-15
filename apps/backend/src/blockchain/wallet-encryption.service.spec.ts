import { Test, TestingModule } from '@nestjs/testing';
import { WalletEncryptionService } from './wallet-encryption.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

describe('WalletEncryptionService', () => {
  let service: WalletEncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletEncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'WALLET_ENCRYPTION_KEY') {
                return 'test-secret-master-key-for-unit-tests-32b!';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WalletEncryptionService>(WalletEncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encryptPrivateKey & decryptPrivateKey', () => {
    it('should encrypt and decrypt a private key successfully (round-trip)', () => {
      const wallet = ethers.Wallet.createRandom();
      const plainPrivateKey = wallet.privateKey;

      const encrypted = service.encryptPrivateKey(plainPrivateKey);

      expect(encrypted).toBeDefined();
      expect(encrypted.encryptedPrivateKey).toBeDefined();
      expect(typeof encrypted.encryptedPrivateKey).toBe('string');
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.encryptedPrivateKey).not.toBe(plainPrivateKey);

      const decrypted = service.decryptPrivateKey(
        encrypted.encryptedPrivateKey,
        encrypted.iv,
        encrypted.authTag,
      );

      expect(decrypted).toBe(plainPrivateKey);

      // Verify that the decrypted key can recreate the same wallet address
      const reconstructedWallet = new ethers.Wallet(decrypted);
      expect(reconstructedWallet.address).toBe(wallet.address);
    });

    it('should produce different IVs and ciphertexts for subsequent encryptions of the same key', () => {
      const plainKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      const enc1 = service.encryptPrivateKey(plainKey);
      const enc2 = service.encryptPrivateKey(plainKey);

      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.encryptedPrivateKey).not.toBe(enc2.encryptedPrivateKey);

      expect(service.decryptPrivateKey(enc1.encryptedPrivateKey, enc1.iv, enc1.authTag)).toBe(plainKey);
      expect(service.decryptPrivateKey(enc2.encryptedPrivateKey, enc2.iv, enc2.authTag)).toBe(plainKey);
    });

    it('should throw an error if authentication tag is tampered', () => {
      const plainKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const enc = service.encryptPrivateKey(plainKey);

      // Tamper with the auth tag
      const tamperedAuthTag = enc.authTag.startsWith('00')
        ? 'ff' + enc.authTag.substring(2)
        : '00' + enc.authTag.substring(2);

      expect(() => {
        service.decryptPrivateKey(enc.encryptedPrivateKey, enc.iv, tamperedAuthTag);
      }).toThrow(/tampering detected/i);
    });

    it('should throw an error if ciphertext is tampered', () => {
      const plainKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const enc = service.encryptPrivateKey(plainKey);

      // Tamper with the ciphertext
      const tamperedCiphertext = enc.encryptedPrivateKey.startsWith('aa')
        ? 'bb' + enc.encryptedPrivateKey.substring(2)
        : 'aa' + enc.encryptedPrivateKey.substring(2);

      expect(() => {
        service.decryptPrivateKey(tamperedCiphertext, enc.iv, enc.authTag);
      }).toThrow(/tampering detected/i);
    });

    it('should throw an error if empty or invalid parameters are provided', () => {
      expect(() => service.encryptPrivateKey('')).toThrow('Plain private key must be a non-empty string');
      expect(() => service.encryptPrivateKey(null as any)).toThrow();
      expect(() => service.decryptPrivateKey('', 'iv', 'tag')).toThrow();
      expect(() => service.decryptPrivateKey('enc', '', 'tag')).toThrow();
      expect(() => service.decryptPrivateKey('enc', 'iv', '')).toThrow();
    });
  });

  describe('generateCustodialWallet', () => {
    it('should generate a valid custodial wallet with address and encrypted key bundle', () => {
      const walletBundle = service.generateCustodialWallet();

      expect(walletBundle).toBeDefined();
      expect(walletBundle.address).toBeDefined();
      expect(ethers.isAddress(walletBundle.address)).toBe(true);
      expect(walletBundle.encryptedPrivateKey).toBeDefined();
      expect(walletBundle.iv).toBeDefined();
      expect(walletBundle.authTag).toBeDefined();

      const decryptedKey = service.decryptPrivateKey(
        walletBundle.encryptedPrivateKey,
        walletBundle.iv,
        walletBundle.authTag,
      );

      const verifiedWallet = new ethers.Wallet(decryptedKey);
      expect(verifiedWallet.address).toBe(walletBundle.address);
    });
  });
});
