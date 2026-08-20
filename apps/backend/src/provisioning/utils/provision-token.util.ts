import * as crypto from 'crypto';

// Unambiguous character set (no 0/O/1/I to prevent reading/transcription mistakes)
const TOKEN_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a short, human-readable alphanumeric provision token (e.g., 'ABC123')
 * @param length Defaults to 6 characters
 */
export function generateShortProvisionToken(length: number = 6): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    const index = bytes[i] % TOKEN_CHARS.length;
    result += TOKEN_CHARS[index];
  }
  return result;
}

/**
 * Normalizes a MAC address string to standard uppercase colon-delimited format (e.g. 'AA:BB:CC:DD:EE:FF')
 */
export function normalizeMacAddress(mac: string): string {
  const clean = mac.trim().replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length === 12) {
    return clean.match(/.{1,2}/g)!.join(':');
  }
  return mac.trim().toUpperCase();
}
