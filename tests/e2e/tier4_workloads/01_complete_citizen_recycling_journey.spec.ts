/**
 * Tier 4: Real-World Workload Scenarios - Complete Citizen Recycling & Reward Journey
 * Tests full end-to-end lifecycle across Auth, IoT, Hardware Provisioning, Cryptographic QR, BullMQ, ERC-20, and Dashboard.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createValidRegisterPayload, createValidLoginPayload } from '../fixtures/auth.fixture';
import { createValidZonePayload, createValidStationPayload, createValidActivationPayload } from '../fixtures/station.fixture';
import { createNormalTelemetryPayload } from '../fixtures/telemetry.fixture';

export function registerCompleteCitizenJourneyTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Full Citizen Recycling & Reward Journey', 'Tier 4');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Journey 1: Full 10-Step Lifecycle
  suite.it('Journey 1: Comprehensive 10-Step Citizen Recycling, Hardware Provisioning, and On-Chain Reward Journey', async () => {
    console.log('\n   [Step 1] Citizen registers on CleanCity PWA...');
    const citizenPayload = createValidRegisterPayload({
      name: 'Sofia Recicladora',
      email: 'sofia.recicla@test.io',
      password: 'Password123!Secure',
    });
    const regRes = await harness.request('POST', '/api/v1/auth/register', { body: citizenPayload });
    expect(regRes.status).toBe(201);
    const citizenWallet = regRes.data.walletAddress;
    const citizenCookies = regRes.cookies;
    expect(citizenWallet).toBeDefined();

    console.log('   [Step 2] Admin logs in and registers new Zone & Smart Station...');
    const adminLogin = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    expect(adminLogin.status).toBe(200);

    const zoneRes = await harness.request('POST', '/api/v1/zonas', {
      cookies: adminLogin.cookies,
      body: createValidZonePayload({ name: 'Distrito Tecnológico Central' }),
    });
    expect(zoneRes.status).toBe(201);
    const zoneId = zoneRes.data.id;

    const stationRes = await harness.request('POST', '/api/v1/estaciones', {
      cookies: adminLogin.cookies,
      body: createValidStationPayload(zoneId, {
        name: 'Estación Inteligente Nodo Tech 01',
        location: 'Avenida Innovación #500',
        macAddress: 'CC:DD:EE:77:88:99',
      }),
    });
    expect(stationRes.status).toBe(201);
    expect(stationRes.data.status).toBe('PENDING_ACTIVATION');
    const stationId = stationRes.data.id;
    const stationToken = stationRes.data.token;
    const macAddress = stationRes.data.macAddress;

    console.log('   [Step 3] ESP32 boots up and performs zero-touch activation...');
    const activationRes = await harness.request('POST', '/api/v1/estaciones/activar', {
      body: createValidActivationPayload(macAddress, stationToken),
    });
    expect(activationRes.status).toBe(200);
    expect(activationRes.data.status).toBe('ACTIVE');

    console.log('   [Step 4] ESP32 station sends initial baseline telemetry...');
    const telemetriaRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: createNormalTelemetryPayload(macAddress, stationToken),
    });
    expect(telemetriaRes.status).toBe(200);
    expect(telemetriaRes.data.stationStatus).toBe('ACTIVE');

    console.log('   [Step 5] Citizen inserts plastic bottle; AI logs classification event and generates QR...');
    const classRes = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': stationToken },
      body: {
        categoria: 'Plástico',
        confianza: 0.97,
        stationId,
        peso: 25, // grams
      },
    });
    expect(classRes.status).toBe(201);
    const qrData = classRes.data.qr;
    expect(qrData.codigo).toBeDefined();
    expect(qrData.firma).toBeDefined();

    console.log('   [Step 6] Citizen scans QR code with PWA camera (Verifying signature & TTL)...');
    const verifyRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qrData.codigo}&firma=${encodeURIComponent(qrData.firma)}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data.valido).toBe(true);
    expect(verifyRes.data.puntos).toBe(10);

    console.log('   [Step 7] Citizen claims recycling reward tokens...');
    const claimRes = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: citizenCookies,
      body: { token: qrData.codigo },
    });
    expect(claimRes.status).toBe(200);
    expect(claimRes.data.success).toBe(true);
    expect(claimRes.data.txStatus).toBe('QUEUED');

    console.log('   [Step 8] BullMQ Worker processes batch minting job on ERC-20 contract...');
    const workerResult = harness.blockchain.processBullMqBatch();
    expect(workerResult?.status).toBe('PROCESSED');
    expect(workerResult?.count).toBe(1);
    expect(workerResult?.txHash.startsWith('0x')).toBeTruthy();

    console.log('   [Step 9] Citizen checks updated balance and transaction history on PWA...');
    const balanceRes = await harness.request('GET', `/api/v1/blockchain/balance/${citizenWallet}`);
    expect(balanceRes.status).toBe(200);
    expect(balanceRes.data.balance).toBe('10.0');
    expect(balanceRes.data.simbolo).toBe('RECI');

    const historyRes = await harness.request('GET', `/api/v1/blockchain/transactions/${citizenWallet}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.data.length).toBe(1);
    expect(historyRes.data[0].status).toBe('CONFIRMED');

    console.log('   [Step 10] Admin checks live metrics on central dashboard...');
    const metricsRes = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.data.totalReciclado).toBe(1);
    expect(metricsRes.data.desgloseMateriales.plastico).toBe(1);
    expect(metricsRes.data.ahorroCo2Kg).toBeGreaterThan(0);
  });
}
