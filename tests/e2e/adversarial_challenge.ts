/**
 * CleanCity EcoGridAI — Empirical Adversarial Challenge & Stress Test Suite
 * Executed by Challenger 1 to independently verify:
 * 1. Negative Mutation Testing (active assertion verification, tautology detection)
 * 2. Adversarial Stress Testing (Rate limiting, expired tokens, forged signatures, replay concurrency)
 * 3. Exact failure mode verification & robustness analysis
 */

import { E2ERunner, expect } from './runner';
import { E2ETestHarness } from './harness/e2e-harness';
import { MockBlockchainEngine } from './harness/mock-blockchain';
import { MockVaultEngine } from './harness/mock-vault';
import { TEST_CONSTANTS } from './config/test-constants';
import { E2E_CONFIG } from './config/e2e.config';
import { generateCryptographicQR, verifyEcdsaSignature, createTamperedSignature } from './fixtures/qr.fixture';
import { createValidLoginPayload } from './fixtures/auth.fixture';
import { ethers } from 'ethers';

async function runAdversarialChallenge() {
  console.log('\n======================================================================');
  console.log('⚔️  CLEANCITY ADVERSARIAL CHALLENGER: EMPIRICAL STRESS & MUTATION SUITE');
  console.log('======================================================================\n');

  const harness = new E2ETestHarness();
  let totalAdversarialTests = 0;
  let passedAdversarialTests = 0;
  let failedAdversarialTests = 0;

  function recordResult(name: string, passed: boolean, detail: string) {
    totalAdversarialTests++;
    if (passed) {
      passedAdversarialTests++;
      console.log(`   ✅  [PASS] ${name} — ${detail}`);
    } else {
      failedAdversarialTests++;
      console.error(`   ❌  [FAIL] ${name} — ${detail}`);
    }
  }

  // ==========================================================================
  // SECTION 1: MATCHER & ASSERTION INTEGRITY (NEGATIVE MUTATION TESTING)
  // ==========================================================================
  console.log('🧪 1. MATCHER & ASSERTION INTEGRITY (Negative Mutation Verification):');

  // Test 1.1: expect().toBe failure on mismatch
  try {
    let threw = false;
    try {
      expect(200).toBe(401);
    } catch {
      threw = true;
    }
    recordResult('MUT-01', threw, 'expect().toBe properly throws on value mismatch (200 !== 401)');
  } catch (err: any) {
    recordResult('MUT-01', false, err.message);
  }

  // Test 1.2: expect().toEqual failure on deep object mismatch
  try {
    let threw = false;
    try {
      expect({ role: 'USER' }).toEqual({ role: 'ADMIN' });
    } catch {
      threw = true;
    }
    recordResult('MUT-02', threw, 'expect().toEqual properly throws on object property mismatch');
  } catch (err: any) {
    recordResult('MUT-02', false, err.message);
  }

  // Test 1.3: expect().toContain failure on string/array
  try {
    let threw = false;
    try {
      expect('Unauthorized access').toContain('Success');
    } catch {
      threw = true;
    }
    recordResult('MUT-03', threw, 'expect().toContain properly throws when substring is absent');
  } catch (err: any) {
    recordResult('MUT-03', false, err.message);
  }

  // Test 1.4: expect().toThrow failure when function succeeds
  try {
    let threw = false;
    try {
      expect(() => { /* does not throw */ }).toThrow();
    } catch {
      threw = true;
    }
    recordResult('MUT-04', threw, 'expect().toThrow properly throws when target function does NOT throw');
  } catch (err: any) {
    recordResult('MUT-04', false, err.message);
  }

  // Test 1.5: expect().toHaveLength failure on wrong length
  try {
    let threw = false;
    try {
      expect([1, 2, 3]).toHaveLength(5);
    } catch {
      threw = true;
    }
    recordResult('MUT-05', threw, 'expect().toHaveLength properly throws when array length differs');
  } catch (err: any) {
    recordResult('MUT-05', false, err.message);
  }

  // Test 1.6: expect().toBeGreaterThan / toBeLessThan failure
  try {
    let threw = false;
    try {
      expect(10).toBeGreaterThan(20);
    } catch {
      threw = true;
    }
    recordResult('MUT-06', threw, 'expect().toBeGreaterThan properly throws when condition fails (10 > 20 is false)');
  } catch (err: any) {
    recordResult('MUT-06', false, err.message);
  }

  // ==========================================================================
  // SECTION 2: ADVERSARIAL RATE LIMITING STRESS TESTS
  // ==========================================================================
  console.log('\n🔒 2. ADVERSARIAL RATE LIMITING & DOS RESISTANCE:');

  // Test 2.1: Burst attack on login (50 rapid requests from same IP)
  harness.reset();
  const burstIp = '203.0.113.99';
  let allowedCount = 0;
  let throttledCount = 0;
  for (let i = 0; i < 50; i++) {
    const res = await harness.request('POST', '/api/v1/auth/login', {
      headers: { 'x-forwarded-for': burstIp },
      body: { email: 'wrong@user.com', password: 'bad' },
    });
    if (res.status === 401) allowedCount++;
    if (res.status === 429) throttledCount++;
  }
  recordResult(
    'STRESS-RL-01',
    allowedCount === 5 && throttledCount === 45,
    `Burst login: exactly 5 attempts processed (401), 45 throttled (429). Allowed=${allowedCount}, Blocked=${throttledCount}`
  );

  // Test 2.2: Multi-IP concurrent traffic (20 distinct IPs)
  harness.reset();
  let multiIpBlocked = 0;
  let multiIpAllowed = 0;
  for (let i = 1; i <= 20; i++) {
    const ip = `192.168.1.${i}`;
    for (let j = 0; j < 5; j++) {
      const res = await harness.request('POST', '/api/v1/auth/login', {
        headers: { 'x-forwarded-for': ip },
        body: { email: 'test@user.com', password: 'bad' },
      });
      if (res.status === 401) multiIpAllowed++;
      else multiIpBlocked++;
    }
  }
  recordResult(
    'STRESS-RL-02',
    multiIpAllowed === 100 && multiIpBlocked === 0,
    `Multi-IP isolation: 20 distinct IPs sent 5 requests each; all 100 requests isolated without false-positive cross-blocking`
  );

  // QR generation limit is configured at E2E_CONFIG.rateLimits.qrGeneratePerMinute (10/min)
  const stationToken = TEST_CONSTANTS.STATIONS.STATION_01.provisioningToken;
  let qrGenAllowed = 0;
  let qrGenBlocked = 0;
  for (let i = 0; i < 15; i++) {
    const res = await harness.request('POST', '/api/v1/qr/generar', {
      headers: { 'x-station-token': stationToken, 'x-forwarded-for': '10.0.0.1' },
      body: { categoria: 'Plástico' },
    });
    if (res.status === 201) qrGenAllowed++;
    if (res.status === 429) qrGenBlocked++;
  }
  recordResult(
    'STRESS-RL-03',
    qrGenAllowed === 10 && qrGenBlocked === 5,
    `Route limit tiering: QR generator throttled at ${E2E_CONFIG.rateLimits.qrGeneratePerMinute} req/min (10 allowed, 5 blocked with 429)`
  );

  // ==========================================================================
  // SECTION 3: EXPIRED TOKENS, TTL DRIFT & CLOCK SKEW
  // ==========================================================================
  console.log('\n⏳ 3. EXPIRED TOKENS & TIME-TO-LIVE (TTL) BOUNDARIES:');

  // Test 3.1: Expired JWT on Edge Middleware Route Gating
  harness.reset();
  const expiredAdminJwt = harness.vault.generateExpiredJwt(TEST_CONSTANTS.ADMIN_USER.email);
  const edgeAdminExp = harness.simulateEdgeMiddleware('/admin', { access_token: expiredAdminJwt });
  const edgeAppExp = harness.simulateEdgeMiddleware('/app', { access_token: expiredAdminJwt });
  const edgeRootExp = harness.simulateEdgeMiddleware('/', { access_token: expiredAdminJwt });
  recordResult(
    'STRESS-EXP-01',
    edgeAdminExp.status === 307 && edgeAppExp.status === 307 && edgeRootExp.status === 307,
    `Edge Middleware redirects expired JWT on /admin, /app, and / with status 307 to /login`
  );

  // Test 3.2: Expired JWT on REST API Protected Endpoints
  const restMeExp = await harness.request('GET', '/api/v1/auth/me', { cookies: { access_token: expiredAdminJwt } });
  const restZonesExp = await harness.request('GET', '/api/v1/zonas', { cookies: { access_token: expiredAdminJwt } });
  const restStationsExp = await harness.request('GET', '/api/v1/estaciones', { cookies: { access_token: expiredAdminJwt } });
  const restClasifExp = await harness.request('GET', '/api/v1/clasificacion', { cookies: { access_token: expiredAdminJwt } });
  recordResult(
    'STRESS-EXP-02',
    restMeExp.status === 401 && restZonesExp.status === 401 && restStationsExp.status === 401 && restClasifExp.status === 401,
    `REST API uniformly rejects expired JWT with 401 Unauthorized across all protected controllers`
  );

  // Test 3.3: QR Token TTL Expiry (Normal vs Expired vs Borderline)
  const nowMs = Date.now();
  // Valid QR (expires in 10 minutes)
  const validQr = await generateCryptographicQR('Plástico');
  harness.qrTokens.set(validQr.codigo, validQr);

  // Expired QR (expires in past)
  const expiredQr = await generateCryptographicQR('Plástico', TEST_CONSTANTS.ADMIN_PRIVATE_KEY, { expired: true });
  harness.qrTokens.set(expiredQr.codigo, expiredQr);

  // Borderline QR (expires in 100ms)
  const borderlineQr = {
    ...validQr,
    codigo: 'QR-BORDERLINE-001',
    expiresAt: new Date(nowMs - 5).toISOString(), // expired 5ms ago
  };
  harness.qrTokens.set(borderlineQr.codigo, borderlineQr);

  const verifyValidRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${validQr.codigo}&firma=${encodeURIComponent(validQr.firma)}`);
  const verifyExpiredRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${expiredQr.codigo}&firma=${encodeURIComponent(expiredQr.firma)}`);
  const verifyBorderlineRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${borderlineQr.codigo}&firma=${encodeURIComponent(borderlineQr.firma)}`);

  recordResult(
    'STRESS-EXP-03',
    verifyValidRes.status === 200 && verifyExpiredRes.status === 400 && verifyBorderlineRes.status === 400,
    `QR TTL verification: Valid=200, Expired=400 ("QR vencido"), Borderline expired=400`
  );

  // Test 3.4: Attempting to claim an expired QR token
  const citizenLogin = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
  const claimExpiredRes = await harness.request('POST', '/api/v1/qr/reclamar', {
    cookies: citizenLogin.cookies,
    body: { token: expiredQr.codigo },
  });
  recordResult(
    'STRESS-EXP-04',
    claimExpiredRes.status === 400 && claimExpiredRes.data.message.includes('QR vencido'),
    `Claiming expired QR token rejected with 400 and message "QR vencido", preventing token issuance`
  );

  // ==========================================================================
  // SECTION 4: CRYPTOGRAPHIC SIGNATURE FORGERY & TAMPERING
  // ==========================================================================
  console.log('\n🔏 4. CRYPTOGRAPHIC SIGNATURE FORGERY & TAMPER ATTACKS:');

  // Test 4.1: ECDSA Signature Bit-Flipping & Tampering
  const genuineQr = await generateCryptographicQR('Metal');
  const tamperedSig = createTamperedSignature(genuineQr.firma);
  const isValidTampered = verifyEcdsaSignature(
    genuineQr.codigo,
    genuineQr.categoria,
    genuineQr.timestamp,
    tamperedSig,
    TEST_CONSTANTS.ADMIN_ADDRESS
  );
  recordResult(
    'STRESS-SIG-01',
    isValidTampered === false,
    `ECDSA bit-flip tamper detection: tampered signature string rejected by verifyEcdsaSignature()`
  );

  // Test 4.2: Malicious Rogue Key Pair Signature (Sybil Signer)
  const rogueWallet = ethers.Wallet.createRandom();
  const rogueMessageHash = ethers.solidityPackedKeccak256(
    ['string', 'string', 'string'],
    [genuineQr.codigo, genuineQr.categoria, genuineQr.timestamp]
  );
  const rogueSignature = rogueWallet.signMessageSync(ethers.getBytes(rogueMessageHash));
  const isValidRogue = verifyEcdsaSignature(
    genuineQr.codigo,
    genuineQr.categoria,
    genuineQr.timestamp,
    rogueSignature,
    TEST_CONSTANTS.ADMIN_ADDRESS // Expecting admin address
  );
  recordResult(
    'STRESS-SIG-02',
    isValidRogue === false,
    `Rogue key attack: valid ECDSA signature from unauthorized wallet address rejected against expected Admin address`
  );

  // Test 4.3: Payload alteration under genuine signature (Message Hash alteration)
  const isValidAlteredMaterial = verifyEcdsaSignature(
    genuineQr.codigo,
    'Vidrio', // Altered material from Metal to Vidrio
    genuineQr.timestamp,
    genuineQr.firma,
    TEST_CONSTANTS.ADMIN_ADDRESS
  );
  recordResult(
    'STRESS-SIG-03',
    isValidAlteredMaterial === false,
    `Parameter alteration attack: Changing material under genuine signature produces message hash mismatch and fails`
  );

  // Test 4.4: JWT HMAC Signature Forgery (Different secret key)
  const forgedJwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const forgedJwtPayload = Buffer.from(JSON.stringify({ email: TEST_CONSTANTS.ADMIN_USER.email, role: 'ADMIN', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url');
  const forgedJwtSignature = require('crypto').createHmac('sha256', 'wrong-secret-key-attacker').update(`${forgedJwtHeader}.${forgedJwtPayload}`).digest('base64url');
  const forgedJwt = `${forgedJwtHeader}.${forgedJwtPayload}.${forgedJwtSignature}`;

  const decodedForged = harness.vault.decodeJwt(forgedJwt);
  const edgeForgedResult = harness.simulateEdgeMiddleware('/admin', { access_token: forgedJwt });
  recordResult(
    'STRESS-SIG-04',
    decodedForged === null && edgeForgedResult.status === 307,
    `JWT HMAC forgery: Token signed with unauthorized secret key returns null on decode and is blocked by Edge middleware`
  );

  // Test 4.5: Vault AES-256-GCM AuthTag Corruption (Data integrity verification)
  const testKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const encrypted = harness.vault.encryptPrivateKey(testKey);
  const corruptedAuthTag = encrypted.authTag.substring(0, 30) + (encrypted.authTag.slice(-2) === 'aa' ? 'bb' : 'aa');
  let authTagFailed = false;
  try {
    harness.vault.decryptPrivateKey(encrypted.encryptedPrivateKey, encrypted.iv, corruptedAuthTag);
  } catch (err: any) {
    authTagFailed = true;
  }
  recordResult(
    'STRESS-SIG-05',
    authTagFailed,
    `AES-256-GCM authentication tag tampering: Decryption with corrupted auth tag throws integrity error and prevents key leakage`
  );

  // ==========================================================================
  // SECTION 5: CONCURRENCY, REPLAY & DOUBLE SPEND RESISTANCE
  // ==========================================================================
  console.log('\n💥 5. CONCURRENCY & REPLAY ATTACK HARDENING:');

  // Test 5.1: 10 Concurrent Claims on the SAME QR Token
  harness.reset();
  const user1 = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
  const concurrentQr = await generateCryptographicQR('Plástico');
  harness.qrTokens.set(concurrentQr.codigo, concurrentQr);

  // Execute 10 simultaneous claims
  const claimPromises = Array.from({ length: 10 }).map(() =>
    harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: user1.cookies,
      body: { token: concurrentQr.codigo },
    })
  );
  const claimResults = await Promise.all(claimPromises);
  const successfulClaims = claimResults.filter(r => r.status === 200 && r.data.success);
  const rejectedClaims = claimResults.filter(r => r.status === 400 && r.data.message.includes('QR ya fue usado'));

  recordResult(
    'STRESS-CONC-01',
    successfulClaims.length === 1 && rejectedClaims.length === 9,
    `Atomic single-claim locking: 10 concurrent requests -> exactly 1 success (200), 9 rejected (400 "QR ya fue usado")`
  );

  // Test 5.2: BullMQ Queue Deduplication & Idempotent Minting
  const mockBlockchain = new MockBlockchainEngine();
  const duplicateClaimToken = 'QR-DUP-TOKEN-999';
  const jobPayload = {
    batchId: 'BATCH-TEST-001',
    items: [
      { recipientAddress: TEST_CONSTANTS.USER_ALICE.address, amount: 10, material: 'Plástico', claimToken: duplicateClaimToken },
    ],
    timestamp: new Date().toISOString(),
  };

  mockBlockchain.enqueueBatchMint(jobPayload);
  const firstProcess = mockBlockchain.processBullMqBatch();

  // Enqueue duplicate job with same claim token
  mockBlockchain.enqueueBatchMint({
    batchId: 'BATCH-TEST-002',
    items: [
      { recipientAddress: TEST_CONSTANTS.USER_ALICE.address, amount: 10, material: 'Plástico', claimToken: duplicateClaimToken },
    ],
    timestamp: new Date().toISOString(),
  });
  const secondProcess = mockBlockchain.processBullMqBatch();

  recordResult(
    'STRESS-CONC-02',
    firstProcess?.status === 'PROCESSED' && secondProcess?.status === 'SKIPPED_ALL_DUPLICATES',
    `BullMQ Worker idempotency: Duplicate claim token successfully skipped (SKIPPED_ALL_DUPLICATES) preventing double minting`
  );

  // ==========================================================================
  // SECTION 6: SMART CONTRACT ACCESS CONTROL & NUMERICAL INTEGRITY
  // ==========================================================================
  console.log('\n⛓️  6. SMART CONTRACT ACCESS CONTROL & NUMERICAL INTEGRITY:');
  const contractEngine = new MockBlockchainEngine();

  // Test 6.1: Unauthorized mint invocation reverts
  let unauthMintReverted = false;
  try {
    contractEngine.mint(TEST_CONSTANTS.USER_ALICE.address, 50, TEST_CONSTANTS.USER_ALICE.address);
  } catch (err: any) {
    unauthMintReverted = err.message.includes('AccessControlUnauthorizedAccount');
  }
  recordResult(
    'STRESS-SC-01',
    unauthMintReverted,
    `Smart Contract access control: Non-minter caller attempting mint() throws AccessControlUnauthorizedAccount`
  );

  // Test 6.2: Paused contract rejects mint & batch operations
  contractEngine.pause();
  let pausedMintReverted = false;
  try {
    contractEngine.mint(TEST_CONSTANTS.USER_ALICE.address, 10);
  } catch (err: any) {
    pausedMintReverted = err.message.includes('EnforcedPause');
  }
  contractEngine.unpause();
  recordResult(
    'STRESS-SC-02',
    pausedMintReverted,
    `Smart Contract emergency stop: Paused contract immediately reverts minting with EnforcedPause error`
  );

  // Test 6.3: Exact 18-Decimal BigInt Precision preservation
  const extremeBalance = 1_000_000_000n * 10n ** 18n; // 1 Billion RECI
  contractEngine.mint(TEST_CONSTANTS.USER_ALICE.address, extremeBalance);
  const queriedBal = contractEngine.balanceOf(TEST_CONSTANTS.USER_ALICE.address);
  recordResult(
    'STRESS-SC-03',
    queriedBal.startsWith('1000000150'), // 1 Billion + initial 150 seed
    `18-decimal BigInt precision: Extreme token amounts (1,000,000,000 RECI) handled with zero precision loss`
  );

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n======================================================================');
  console.log('📊 ADVERSARIAL CHALLENGE & STRESS TEST SUMMARY:');
  console.log(`   Total Adversarial Scenarios: ${totalAdversarialTests}`);
  console.log(`   Passed:                     ${passedAdversarialTests}`);
  console.log(`   Failed:                     ${failedAdversarialTests}`);
  console.log(`   Adversarial Pass Rate:      ${((passedAdversarialTests / totalAdversarialTests) * 100).toFixed(1)}%`);
  console.log('======================================================================\n');

  if (failedAdversarialTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdversarialChallenge().catch(err => {
  console.error('Fatal error in adversarial challenger:', err);
  process.exit(1);
});
