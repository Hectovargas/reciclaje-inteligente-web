/**
 * Tier 4: Real-World Workload Scenarios - Fraud & Tamper Resistance Adversarial Journey
 * Verifies system resistance against signature forgery, replay attacks, spoofed IoT nodes, and smart contract exploits.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { generateCryptographicQR, createTamperedSignature } from '../fixtures/qr.fixture';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerFraudResistanceJourneyTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Fraud & Tamper Resistance Adversarial Journey', 'Tier 4');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Journey 2: Adversarial Attack Campaign
  suite.it('Journey 2: Adversarial Attack Campaign: QR Forgery, Double Claim Replay, IoT Spoofing, and Smart Contract Exploit', async () => {
    console.log('\n   [Attack Vector 1] Attacker generates fake QR with altered ECDSA signature...');
    const genuineQR = await generateCryptographicQR('Metal');
    const forgedFirma = createTamperedSignature(genuineQR.firma);
    harness.qrTokens.set(genuineQR.codigo, { ...genuineQR, firma: forgedFirma });

    const forgeryRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${genuineQR.codigo}&firma=${encodeURIComponent(forgedFirma)}`);
    expect(forgeryRes.status).toBe(400);
    expect(forgeryRes.data.message).toContain('inválida');

    console.log('   [Attack Vector 2] Legitimate user claims valid QR; Attacker attempts double-spend replay...');
    const validQR = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(validQR.codigo, validQR);

    // Alice claims legitimately
    const aliceLogin = await harness.request('POST', '/api/v1/auth/login', {
      body: { email: TEST_CONSTANTS.USER_ALICE.email, password: TEST_CONSTANTS.USER_ALICE.password },
    });
    const aliceClaim = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: aliceLogin.cookies,
      body: { token: validQR.codigo },
    });
    expect(aliceClaim.status).toBe(200);

    // Attacker (Bob) intercepts token and tries second claim
    const bobLogin = await harness.request('POST', '/api/v1/auth/login', {
      body: { email: TEST_CONSTANTS.USER_BOB.email, password: TEST_CONSTANTS.USER_BOB.password },
    });
    const replayClaim = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: bobLogin.cookies,
      body: { token: validQR.codigo },
    });
    expect(replayClaim.status).toBe(400);
    expect(replayClaim.data.message).toContain('QR ya fue usado');

    console.log('   [Attack Vector 3] Attacker attempts rogue IoT telemetry injection with spoofed MAC...');
    const rogueTelemetry = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: 'DE:AD:BE:EF:00:99',
        token: 'ROGUE-INJECTION-TOKEN',
        levels: { papel: 10, plastico: 10, metal: 10 },
      },
    });
    expect(rogueTelemetry.status).toBe(401);

    console.log('   [Attack Vector 4] Attacker attempts direct unauthorized mintBatch call on Smart Contract...');
    const rogueAttackerAddress = '0x1234567890123456789012345678901234567890';
    expect(() => {
      harness.blockchain.mintBatch([rogueAttackerAddress], [1000000], rogueAttackerAddress);
    }).toThrow('AccessControlUnauthorizedAccount');

    console.log('   [Attack Vector 5] Verify platform integrity and balances remain unaltered...');
    const aliceBal = harness.blockchain.balanceOf(TEST_CONSTANTS.USER_ALICE.address);
    expect(parseFloat(aliceBal)).toBeGreaterThanOrEqual(150.0);
  });
}
