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

  // Journey 1.1: Full 10-Step Lifecycle
  suite.it('Journey 1.1: Comprehensive 10-Step Citizen Recycling, Hardware Provisioning, and On-Chain Reward Journey', async () => {
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
        peso: 25,
      },
    });
    expect(classRes.status).toBe(201);
    const qrData = classRes.data.qr;
    expect(qrData.codigo).toBeDefined();

    console.log('   [Step 6] Citizen scans QR code with PWA camera (Verifying signature & TTL)...');
    const verifRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qrData.codigo}&firma=${encodeURIComponent(qrData.firma)}`);
    expect(verifRes.status).toBe(200);
    expect(verifRes.data.valido).toBe(true);
    expect(verifRes.data.puntos).toBe(10);

    console.log('   [Step 7] Citizen claims recycling reward tokens...');
    const claimRes = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: citizenCookies,
      body: { token: qrData.codigo },
    });
    expect(claimRes.status).toBe(200);
    expect(claimRes.data.success).toBe(true);
    expect(claimRes.data.txStatus).toBe('QUEUED');

    console.log('   [Step 8] BullMQ Worker processes batch minting job on ERC-20 contract...');
    const workerRes = harness.blockchain.processBullMqBatch();
    expect(workerRes?.status).toBe('PROCESSED');

    console.log('   [Step 9] Citizen checks updated balance and transaction history on PWA...');
    const balRes = await harness.request('GET', `/api/v1/blockchain/balance/${citizenWallet}`);
    expect(balRes.status).toBe(200);
    expect(balRes.data.balance).toBe('10.0');

    const txRes = await harness.request('GET', `/api/v1/blockchain/transactions/${citizenWallet}`);
    expect(txRes.status).toBe(200);
    expect(txRes.data.length).toBe(1);
    expect(txRes.data[0].amount).toBe('10.0');

    console.log('   [Step 10] Admin checks live metrics on central dashboard...');
    const metricsRes = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.data.totalReciclado).toBeGreaterThanOrEqual(1);
  });

  // Journey 1.2: Multi-Material Recycling Session
  suite.it('Journey 1.2: Multi-Material Recycling Session (Citizen recycles Plastic, Paper, Metal consecutively)', async () => {
    const regRes = await harness.request('POST', '/api/v1/auth/register', {
      body: createValidRegisterPayload({ email: 'multi.material@cleancity.io' }),
    });
    const wallet = regRes.data.walletAddress;
    const cookies = regRes.cookies;
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    // 1. Recycle Plastic (+10)
    const pRes = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.provisioningToken },
      body: { categoria: 'Plástico', confianza: 0.98, stationId: station.id },
    });
    await harness.request('POST', '/api/v1/qr/reclamar', { cookies, body: { token: pRes.data.qr.codigo } });

    // 2. Recycle Paper (+5)
    const paRes = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.provisioningToken },
      body: { categoria: 'Papel', confianza: 0.96, stationId: station.id },
    });
    await harness.request('POST', '/api/v1/qr/reclamar', { cookies, body: { token: paRes.data.qr.codigo } });

    // 3. Recycle Metal (+15)
    const mRes = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.provisioningToken },
      body: { categoria: 'Metal', confianza: 0.95, stationId: station.id },
    });
    await harness.request('POST', '/api/v1/qr/reclamar', { cookies, body: { token: mRes.data.qr.codigo } });

    // Process all 3 in batch
    harness.blockchain.processBullMqBatch();
    harness.blockchain.processBullMqBatch();
    harness.blockchain.processBullMqBatch();

    // Check balance = 10 + 5 + 15 = 30 RECI
    const balRes = await harness.request('GET', `/api/v1/blockchain/balance/${wallet}`);
    expect(balRes.data.balance).toBe('30.0');
  });

  // Journey 1.3: Concurrent Dual-Citizen Recycling at Separate Stations
  suite.it('Journey 1.3: Concurrent Dual-Citizen Recycling at Separate Stations', async () => {
    const citizen1 = await harness.request('POST', '/api/v1/auth/register', { body: createValidRegisterPayload({ email: 'user1.journey@cleancity.io' }) });
    const citizen2 = await harness.request('POST', '/api/v1/auth/register', { body: createValidRegisterPayload({ email: 'user2.journey@cleancity.io' }) });

    const st1 = harness.stations.get('station-uuid-001')!;
    const st2 = harness.stations.get('station-uuid-002')!;

    const qr1 = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': st1.token },
      body: { categoria: 'Plástico', confianza: 0.94, stationId: st1.id },
    });
    const qr2 = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': st2.token },
      body: { categoria: 'Metal', confianza: 0.99, stationId: st2.id },
    });

    await harness.request('POST', '/api/v1/qr/reclamar', { cookies: citizen1.cookies, body: { token: qr1.data.qr.codigo } });
    await harness.request('POST', '/api/v1/qr/reclamar', { cookies: citizen2.cookies, body: { token: qr2.data.qr.codigo } });

    harness.blockchain.processBullMqBatch();
    harness.blockchain.processBullMqBatch();

    const bal1 = await harness.request('GET', `/api/v1/blockchain/balance/${citizen1.data.walletAddress}`);
    const bal2 = await harness.request('GET', `/api/v1/blockchain/balance/${citizen2.data.walletAddress}`);

    expect(bal1.data.balance).toBe('10.0');
    expect(bal2.data.balance).toBe('15.0');
  });
}
