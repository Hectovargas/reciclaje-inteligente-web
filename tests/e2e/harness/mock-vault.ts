/**
 * Mock Vault Secrets Engine for CleanCity E2E Tests
 */

import { TEST_CONSTANTS } from '../config/test-constants';

export class MockVaultEngine {
  private secrets: Map<string, Record<string, any>> = new Map();
  private validTokens: Set<string> = new Set(['root', 'test-vault-token']);

  constructor() {
    this.secrets.set('secret/data/reciclaje', {
      admin_private_key: TEST_CONSTANTS.ADMIN_PRIVATE_KEY,
      jwt_secret: 'super-secret-key-reciclaje',
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
}
