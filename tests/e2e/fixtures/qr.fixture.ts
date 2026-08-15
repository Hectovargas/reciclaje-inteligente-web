/**
 * Cryptographic QR Fixtures for CleanCity E2E Tests
 * Implements ECDSA signing over Keccak256(codigo || categoria || timestamp)
 */

import { ethers } from 'ethers';
import { TEST_CONSTANTS } from '../config/test-constants';

export interface QRPayload {
  codigo: string;
  categoria: string;
  firma: string;
  usado: boolean;
  timestamp: string;
  expiresAt: string;
}

export interface ClassificationEventDto {
  categoria: string;
  confianza: number;
  stationId: string;
  peso?: number;
}

export async function generateCryptographicQR(
  categoria: string,
  privateKey: string = TEST_CONSTANTS.ADMIN_PRIVATE_KEY,
  options?: { ttlMinutes?: number; expired?: boolean }
): Promise<QRPayload> {
  const ttlMinutes = options?.ttlMinutes ?? 10;
  const now = Date.now();
  const timestamp = new Date(options?.expired ? now - 15 * 60 * 1000 : now).toISOString();
  const expiresAt = new Date(
    options?.expired ? now - 5 * 60 * 1000 : now + ttlMinutes * 60 * 1000
  ).toISOString();

  const codigo = `QR-${categoria.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Ethers v6 solidityPackedKeccak256
  const messageHash = ethers.solidityPackedKeccak256(
    ['string', 'string', 'string'],
    [codigo, categoria, timestamp]
  );

  const wallet = new ethers.Wallet(privateKey);
  const firma = await wallet.signMessage(ethers.getBytes(messageHash));

  return {
    codigo,
    categoria,
    firma,
    usado: false,
    timestamp,
    expiresAt,
  };
}

export function createTamperedSignature(originalSignature: string): string {
  // Alter the last 4 characters of the hex signature to invalidate ECDSA recovery
  const prefix = originalSignature.slice(0, -4);
  const suffix = originalSignature.slice(-4) === '1234' ? '5678' : '1234';
  return `${prefix}${suffix}`;
}

export function verifyEcdsaSignature(
  codigo: string,
  categoria: string,
  timestamp: string,
  firma: string,
  expectedSignerAddress: string = TEST_CONSTANTS.ADMIN_ADDRESS
): boolean {
  try {
    const messageHash = ethers.solidityPackedKeccak256(
      ['string', 'string', 'string'],
      [codigo, categoria, timestamp]
    );
    const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), firma);
    return recoveredAddress.toLowerCase() === expectedSignerAddress.toLowerCase();
  } catch {
    return false;
  }
}
