/**
 * Mock Vault Secrets & Cryptographic Engine for CleanCity E2E Tests
 * Provides Vault KV secret storage, AES-256-GCM private key encryption, and JWT signing/verification.
 */

import { TEST_CONSTANTS } from '../config/test-constants';
import crypto from 'crypto';

export class MockVaultEngine {
  private secrets: Map<string, Record<string, any>> = new Map();
  private validTokens: Set<string> = new Set(['root', 'test-vault-token']);
  private jwtSecret: string = 'super-secret-key-reciclaje';

  constructor() {
    this.secrets.set('secret/data/reciclaje', {
      admin_private_key: TEST_CONSTANTS.ADMIN_PRIVATE_KEY,
      jwt_secret: this.jwtSecret,
      encryption_key: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    });
  }

  public getSecret(path: string, token: string): { ok: boolean; status: number; data?: any } {
    if (!this.validTokens.has(token)) {
      return { ok: false, status: 403 };
    }
    const cleanPath = path.replace(/^\/v1\//, '');
    const data = this.secrets.get(cleanPath);
    if (!data) {
      return { ok: false, status: 404 };
    }
    return {
      ok: true,
      status: 200,
      data: {
        data: {
          data,
        },
      },
    };
  }

  public setSecret(path: string, secretData: Record<string, any>, token: string): boolean {
    if (!this.validTokens.has(token)) return false;
    const cleanPath = path.replace(/^\/v1\//, '');
    this.secrets.set(cleanPath, secretData);
    return true;
  }

  // --- JWT Simulation ---
  public generateJwt(email: string, expiresInHours: number = 24): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        email,
        sub: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresInHours * 3600,
      })
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  public generateExpiredJwt(email: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        email,
        sub: email,
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      })
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  public decodeJwt(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;
      const expectedSig = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${payload}`)
        .digest('base64url');
      if (signature !== expectedSig) return null;

      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
      if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return parsed.email || parsed.sub || null;
    } catch {
      return null;
    }
  }

  // --- AES-256-GCM Private Key Encryption ---
  public encryptPrivateKey(rawKey: string): { encryptedPrivateKey: string; iv: string; authTag: string } {
    const key = crypto.scryptSync('cleancity-vault-master-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(rawKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedPrivateKey: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  public decryptPrivateKey(encrypted: string, ivHex: string, authTagHex: string): string {
    const key = crypto.scryptSync('cleancity-vault-master-key', 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
