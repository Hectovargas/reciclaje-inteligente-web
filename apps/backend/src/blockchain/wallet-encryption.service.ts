import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ethers } from 'ethers';

export interface EncryptedWalletData {
  encryptedPrivateKey: string;
  iv: string;
  authTag: string;
}

export interface GeneratedCustodialWallet extends EncryptedWalletData {
  address: string;
}

@Injectable()
export class WalletEncryptionService {
  private readonly logger = new Logger(WalletEncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private masterKeyBuffer: Buffer;

  constructor(private readonly configService?: ConfigService) {
    this.initMasterKey();
  }

  private initMasterKey() {
    const rawKey =
      this.configService?.get<string>('WALLET_ENCRYPTION_KEY') ||
      process.env.WALLET_ENCRYPTION_KEY ||
      this.configService?.get<string>('JWT_SECRET') ||
      process.env.JWT_SECRET ||
      'default-dev-wallet-encryption-key-32b-secret!';

    // Derive a fixed 256-bit (32 bytes) master key using SHA-256
    this.masterKeyBuffer = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts a plaintext EVM private key using AES-256-GCM.
   * @param plainKey The hex-encoded private key (with or without '0x' prefix).
   * @returns An object containing the hex-encoded ciphertext, IV, and authentication tag.
   */
  encryptPrivateKey(plainKey: string): EncryptedWalletData {
    if (!plainKey || typeof plainKey !== 'string') {
      throw new Error('Plain private key must be a non-empty string');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKeyBuffer, iv);

    let encrypted = cipher.update(plainKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedPrivateKey: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  /**
   * Decrypts an encrypted private key using AES-256-GCM and verifies the authentication tag.
   * @param encrypted The hex-encoded encrypted private key.
   * @param iv The hex-encoded initialization vector.
   * @param authTag The hex-encoded authentication tag.
   * @returns The original plaintext private key.
   * @throws Error if authentication fails or ciphertext is tampered.
   */
  decryptPrivateKey(encrypted: string, iv: string, authTag: string): string {
    if (!encrypted || !iv || !authTag) {
      throw new Error('Encrypted payload, IV, and authTag must all be provided');
    }

    try {
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKeyBuffer, ivBuffer);

      decipher.setAuthTag(authTagBuffer);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${(error as Error).message}`);
      throw new Error('Decryption failed: invalid ciphertext or authentication tag tampering detected');
    }
  }

  /**
   * Generates a new random EVM custodial wallet and immediately encrypts its private key.
   * @returns The public address and encrypted private key bundle.
   */
  generateCustodialWallet(): GeneratedCustodialWallet {
    const randomWallet = ethers.Wallet.createRandom();
    const encrypted = this.encryptPrivateKey(randomWallet.privateKey);

    return {
      address: randomWallet.address,
      ...encrypted,
    };
  }
}
