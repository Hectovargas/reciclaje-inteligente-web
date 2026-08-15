/**
 * CleanCity E2E Test Suite Configuration
 * Defines environment parameters, endpoint prefixes, timeouts, and cryptographic options.
 */

export const E2E_CONFIG = {
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
  apiPrefix: '/api/v1',
  timeoutMs: 15000,
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-reciclaje',
  vaultAddr: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
  vaultToken: process.env.VAULT_TOKEN || 'root',
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  qrTtlMinutes: 10,
  telemetryWarningThreshold: 80, // >= 80% fill level triggers WARNING
  rateLimits: {
    loginPerMinute: 5,
    qrGeneratePerMinute: 10,
    qrVerifyPerMinute: 20,
    generalPerMinute: 100,
  },
};
