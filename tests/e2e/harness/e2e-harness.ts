/**
 * CleanCity Unified E2E Test Harness
 * Provides opaque-box HTTP client execution and high-fidelity stateful domain simulator.
 */

import { ethers } from 'ethers';
import { E2E_CONFIG } from '../config/e2e.config';
import { TEST_CONSTANTS } from '../config/test-constants';
import { MockBlockchainEngine } from './mock-blockchain';
import { MockVaultEngine } from './mock-vault';
import { generateCryptographicQR, verifyEcdsaSignature } from '../fixtures/qr.fixture';

export interface HttpResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string | string[]>;
  cookies: Record<string, string>;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER' | 'USER';
  walletAddress: string;
  createdAt: Date;
}

export interface ZoneRecord {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StationRecord {
  id: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'WARNING' | 'OFFLINE' | 'PENDING_ACTIVATION';
  capacity: number;
  token?: string;
  macAddress?: string;
  zoneId: string;
  currentLevels?: { papel: number; plastico: number; metal: number };
  battery?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventoRecord {
  id: string;
  categoria: string;
  confianza: number;
  peso?: number;
  stationId: string;
  timestamp: Date;
}

export interface QRTokenRecord {
  id: string;
  codigo: string;
  categoria: string;
  firma: string;
  usado: boolean;
  timestamp: string;
  expiresAt: string;
}

export class E2ETestHarness {
  public blockchain: MockBlockchainEngine;
  public vault: MockVaultEngine;

  // In-Memory CleanCity DB Tables
  public users: Map<string, UserRecord> = new Map();
  public zones: Map<string, ZoneRecord> = new Map();
  public stations: Map<string, StationRecord> = new Map();
  public eventos: EventoRecord[] = [];
  public qrTokens: Map<string, QRTokenRecord> = new Map();

  // Rate Limiting Tracking per IP / Key
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map();

  // Current session cookies for caller
  public sessionCookies: Record<string, string> = {};

  constructor() {
    this.blockchain = new MockBlockchainEngine();
    this.vault = new MockVaultEngine();
    this.seedInitialState();
  }

  public reset() {
    this.users.clear();
    this.zones.clear();
    this.stations.clear();
    this.eventos = [];
    this.qrTokens.clear();
    this.rateLimits.clear();
    this.sessionCookies = {};
    this.blockchain = new MockBlockchainEngine();
    this.vault = new MockVaultEngine();
    this.seedInitialState();
  }

  private seedInitialState() {
    // Seed Admin User
    this.users.set(TEST_CONSTANTS.ADMIN_USER.email, {
      id: 'admin-uuid-000',
      email: TEST_CONSTANTS.ADMIN_USER.email,
      passwordHash: 'admin123_hash',
      name: TEST_CONSTANTS.ADMIN_USER.name,
      role: 'ADMIN',
      walletAddress: TEST_CONSTANTS.ADMIN_USER.address,
      createdAt: new Date(),
    });

    // Seed Manager User
    this.users.set(TEST_CONSTANTS.MANAGER_USER.email, {
      id: 'manager-uuid-001',
      email: TEST_CONSTANTS.MANAGER_USER.email,
      passwordHash: 'manager123_hash',
      name: TEST_CONSTANTS.MANAGER_USER.name,
      role: 'MANAGER',
      walletAddress: TEST_CONSTANTS.MANAGER_USER.address,
      createdAt: new Date(),
    });

    // Seed Alice
    this.users.set(TEST_CONSTANTS.USER_ALICE.email, {
      id: 'alice-uuid-002',
      email: TEST_CONSTANTS.USER_ALICE.email,
      passwordHash: 'Password123!Secure_hash',
      name: TEST_CONSTANTS.USER_ALICE.name,
      role: 'USER',
      walletAddress: TEST_CONSTANTS.USER_ALICE.address,
      createdAt: new Date(),
    });

    // Seed Zones
    for (const z of Object.values(TEST_CONSTANTS.ZONES)) {
      this.zones.set(z.id, {
        id: z.id,
        name: z.name,
        isActive: z.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Seed Stations
    for (const s of Object.values(TEST_CONSTANTS.STATIONS)) {
      this.stations.set(s.id, {
        id: s.id,
        name: s.name,
        location: s.location,
        status: s.status as any,
        capacity: s.capacity,
        token: s.provisioningToken,
        macAddress: s.macAddress,
        zoneId: s.zoneId,
        currentLevels: { papel: 20, plastico: 30, metal: 10 },
        battery: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // --- Simulated HTTP Dispatcher ---
  public async request(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options?: {
      body?: any;
      headers?: Record<string, string>;
      cookies?: Record<string, string>;
      query?: Record<string, string | number | boolean>;
    }
  ): Promise<HttpResponse> {
    const headers = { ...(options?.headers || {}) };
    const cookies = { ...this.sessionCookies, ...(options?.cookies || {}) };
    const cleanPath = path.startsWith('/api/v1') ? path.replace('/api/v1', '') : path;
    const [routePath, queryString] = cleanPath.split('?');

    // Parse query params
    const queryParams: Record<string, string> = { ...(options?.query as any || {}) };
    if (queryString) {
      const sp = new URLSearchParams(queryString);
      sp.forEach((val, key) => {
        queryParams[key] = val;
      });
    }

    // Rate limiting check
    const clientIp = headers['x-forwarded-for'] || '127.0.0.1';
    const rateLimitKey = `${clientIp}:${routePath}`;
    if (!this.checkRateLimit(rateLimitKey, routePath)) {
      return {
        status: 429,
        data: { statusCode: 429, message: 'ThrottlerException: Too Many Requests', code: 'TOO_MANY_REQUESTS' },
        headers: {},
        cookies: {},
      };
    }

    // Router matching
    return this.dispatchRoute(method, routePath, options?.body, headers, cookies, queryParams);
  }

  private checkRateLimit(key: string, route: string): boolean {
    const now = Date.now();
    let limit = E2E_CONFIG.rateLimits.generalPerMinute;
    if (route.startsWith('/auth/login')) limit = E2E_CONFIG.rateLimits.loginPerMinute;
    if (route.startsWith('/qr/generar')) limit = E2E_CONFIG.rateLimits.qrGeneratePerMinute;
    if (route.startsWith('/qr/verificar')) limit = E2E_CONFIG.rateLimits.qrVerifyPerMinute;

    const entry = this.rateLimits.get(key);
    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + 60000 });
      return true;
    }

    if (entry.count >= limit) {
      return false;
    }

    entry.count += 1;
    return true;
  }

  private getAuthenticatedUser(headers: Record<string, string>, cookies: Record<string, string>): UserRecord | null {
    let token = cookies['access_token'];
    if (!token && headers['authorization']) {
      const match = headers['authorization'].match(/^Bearer\s+(.*)$/i);
      if (match) token = match[1];
    }
    if (!token) return null;

    try {
      // Decode mock JWT format: "mock-jwt-<email>-<role>"
      if (token.startsWith('mock-jwt-')) {
        const parts = token.split('-');
        const email = parts[2];
        const user = Array.from(this.users.values()).find(u => u.email === email);
        return user || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private dispatchRoute(
    method: string,
    route: string,
    body: any,
    headers: Record<string, string>,
    cookies: Record<string, string>,
    query: Record<string, string>
  ): HttpResponse {
    const authUser = this.getAuthenticatedUser(headers, cookies);

    // 1. Health
    if (route === '/health' && method === 'GET') {
      return {
        status: 200,
        data: { status: 'ok', info: { database: { status: 'up' }, memory_heap: { status: 'up' } } },
        headers: {},
        cookies: {},
      };
    }

    // 2. Auth Routes
    if (route === '/auth/register' && method === 'POST') {
      const { email, password, name } = body || {};
      if (!email || !password || !name) {
        return { status: 400, data: { message: 'Missing required registration fields' }, headers: {}, cookies: {} };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { status: 400, data: { message: 'Invalid email format' }, headers: {}, cookies: {} };
      }
      if (this.users.has(email)) {
        return { status: 409, data: { message: 'User already exists with this email' }, headers: {}, cookies: {} };
      }

      // Generate random custodial wallet
      const wallet = ethers.Wallet.createRandom();
      const newUser: UserRecord = {
        id: `user-uuid-${Date.now()}`,
        email,
        passwordHash: `${password}_hash`,
        name,
        role: 'USER',
        walletAddress: wallet.address,
        createdAt: new Date(),
      };
      this.users.set(email, newUser);

      const token = `mock-jwt-${email}-USER`;
      this.sessionCookies['access_token'] = token;

      return {
        status: 201,
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          walletAddress: newUser.walletAddress,
        },
        headers: { 'set-cookie': `access_token=${token}; HttpOnly; Secure; SameSite=Strict` },
        cookies: { access_token: token },
      };
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = body || {};
      if (!email || !password) {
        return { status: 400, data: { message: 'Email and password required' }, headers: {}, cookies: {} };
      }
      const user = this.users.get(email);
      if (!user || user.passwordHash !== `${password}_hash`) {
        return { status: 401, data: { message: 'Invalid credentials' }, headers: {}, cookies: {} };
      }

      const token = `mock-jwt-${email}-${user.role}`;
      this.sessionCookies['access_token'] = token;

      return {
        status: 200,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            walletAddress: user.walletAddress,
          },
        },
        headers: { 'set-cookie': `access_token=${token}; HttpOnly; Secure; SameSite=Strict` },
        cookies: { access_token: token },
      };
    }

    if (route === '/auth/logout' && method === 'POST') {
      delete this.sessionCookies['access_token'];
      return {
        status: 200,
        data: { message: 'Logged out successfully' },
        headers: { 'set-cookie': `access_token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict` },
        cookies: {},
      };
    }

    if (route === '/auth/me' && method === 'GET') {
      if (!authUser) {
        return { status: 401, data: { message: 'Unauthorized' }, headers: {}, cookies: {} };
      }
      return {
        status: 200,
        data: {
          user: {
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            role: authUser.role,
            walletAddress: authUser.walletAddress,
          },
        },
        headers: {},
        cookies: {},
      };
    }

    // 3. Zonas Routes
    if (route === '/zonas' && method === 'POST') {
      if (!authUser || authUser.role !== 'ADMIN') {
        return { status: 403, data: { message: 'Forbidden resource: requires ADMIN role' }, headers: {}, cookies: {} };
      }
      const { name, isActive } = body || {};
      if (!name || name.trim().length === 0) {
        return { status: 400, data: { message: 'Zone name cannot be empty' }, headers: {}, cookies: {} };
      }
      const existing = Array.from(this.zones.values()).find(z => z.name.toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        return { status: 409, data: { message: 'Zone with this name already exists' }, headers: {}, cookies: {} };
      }

      const newZone: ZoneRecord = {
        id: `zone-uuid-${Date.now()}`,
        name: name.trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.zones.set(newZone.id, newZone);
      return { status: 201, data: newZone, headers: {}, cookies: {} };
    }

    if (route === '/zonas' && method === 'GET') {
      if (!authUser) {
        return { status: 401, data: { message: 'Unauthorized' }, headers: {}, cookies: {} };
      }
      const includeInactive = query['includeInactive'] === 'true';
      const list = Array.from(this.zones.values()).filter(z => includeInactive || z.isActive);
      return { status: 200, data: list, headers: {}, cookies: {} };
    }

    if (route.startsWith('/zonas/') && method === 'GET') {
      if (!authUser) {
        return { status: 401, data: { message: 'Unauthorized' }, headers: {}, cookies: {} };
      }
      const zoneId = route.replace('/zonas/', '');
      const zone = this.zones.get(zoneId);
      if (!zone) {
        return { status: 404, data: { message: 'Zone not found' }, headers: {}, cookies: {} };
      }
      const stationsInZone = Array.from(this.stations.values()).filter(s => s.zoneId === zoneId);
      return { status: 200, data: { ...zone, stations: stationsInZone }, headers: {}, cookies: {} };
    }

    if (route.startsWith('/zonas/') && (method === 'PATCH' || method === 'PUT')) {
      if (!authUser || authUser.role !== 'ADMIN') {
        return { status: 403, data: { message: 'Forbidden resource: requires ADMIN role' }, headers: {}, cookies: {} };
      }
      const zoneId = route.replace('/zonas/', '');
      const zone = this.zones.get(zoneId);
      if (!zone) {
        return { status: 404, data: { message: 'Zone not found' }, headers: {}, cookies: {} };
      }
      if (body?.name) zone.name = body.name.trim();
      if (body?.isActive !== undefined) zone.isActive = Boolean(body.isActive);
      zone.updatedAt = new Date();
      return { status: 200, data: zone, headers: {}, cookies: {} };
    }

    // 4. Estaciones Routes
    if ((route === '/estaciones' || route === '/dashboard/stations') && method === 'POST') {
      if (!authUser || authUser.role !== 'ADMIN') {
        return { status: 403, data: { message: 'Forbidden resource: requires ADMIN role' }, headers: {}, cookies: {} };
      }
      const { name, location, zoneId, macAddress, capacity } = body || {};
      if (!name || !location || !zoneId) {
        return { status: 400, data: { message: 'Missing required station fields' }, headers: {}, cookies: {} };
      }
      if (!this.zones.has(zoneId)) {
        return { status: 404, data: { message: 'Specified zoneId not found' }, headers: {}, cookies: {} };
      }
      if (capacity !== undefined && (typeof capacity !== 'number' || capacity <= 0)) {
        return { status: 400, data: { message: 'Capacity must be a positive integer' }, headers: {}, cookies: {} };
      }

      const provToken = `PROV-TOK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const newStation: StationRecord = {
        id: `station-uuid-${Date.now()}`,
        name: name.trim(),
        location: location.trim(),
        status: macAddress ? 'PENDING_ACTIVATION' : 'ACTIVE',
        capacity: capacity || 100,
        token: provToken,
        macAddress,
        zoneId,
        currentLevels: { papel: 0, plastico: 0, metal: 0 },
        battery: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.stations.set(newStation.id, newStation);
      return { status: 201, data: newStation, headers: {}, cookies: {} };
    }

    if ((route === '/estaciones' || route === '/dashboard/stations') && method === 'GET') {
      if (!authUser) {
        return { status: 401, data: { message: 'Unauthorized' }, headers: {}, cookies: {} };
      }
      const list = Array.from(this.stations.values()).map(s => ({
        ...s,
        status: s.status.toLowerCase(), // Normalized for dashboard
      }));
      return { status: 200, data: list, headers: {}, cookies: {} };
    }

    if (route.startsWith('/estaciones/') && route.endsWith('/revoke-token') && method === 'POST') {
      if (!authUser || authUser.role !== 'ADMIN') {
        return { status: 403, data: { message: 'Forbidden resource: requires ADMIN role' }, headers: {}, cookies: {} };
      }
      const stationId = route.replace('/estaciones/', '').replace('/revoke-token', '');
      const station = this.stations.get(stationId);
      if (!station) {
        return { status: 404, data: { message: 'Station not found' }, headers: {}, cookies: {} };
      }
      station.token = `PROV-TOK-REVOKED-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      station.updatedAt = new Date();
      return { status: 200, data: { stationId: station.id, newToken: station.token }, headers: {}, cookies: {} };
    }

    // 5. ESP32 Zero-Touch Activation
    if ((route === '/estaciones/activar' || route === '/iot/ping') && method === 'POST') {
      const { macAddress, provisioningToken } = body || {};
      if (!macAddress || !provisioningToken) {
        return { status: 400, data: { message: 'macAddress and provisioningToken are required' }, headers: {}, cookies: {} };
      }
      if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress)) {
        return { status: 400, data: { message: 'Malformed MAC address format' }, headers: {}, cookies: {} };
      }

      const station = Array.from(this.stations.values()).find(
        s => s.macAddress?.toLowerCase() === macAddress.toLowerCase() && s.token === provisioningToken
      );

      if (!station) {
        return { status: 401, data: { message: 'Invalid station credentials or provisioning token' }, headers: {}, cookies: {} };
      }

      if (station.status === 'OFFLINE') {
        return { status: 400, data: { message: 'Cannot activate decommissioned/offline station' }, headers: {}, cookies: {} };
      }

      station.status = 'ACTIVE';
      station.updatedAt = new Date();

      return {
        status: 200,
        data: {
          status: 'ACTIVE',
          stationId: station.id,
          name: station.name,
          message: 'Station successfully activated and provisioned',
        },
        headers: {},
        cookies: {},
      };
    }

    // 6. IoT Ultrasonic Telemetry
    if (route === '/iot/telemetria' && method === 'POST') {
      const { macAddress, token, levels, battery } = body || {};
      if (!macAddress || !token || !levels) {
        return { status: 400, data: { message: 'Missing telemetry payload fields' }, headers: {}, cookies: {} };
      }

      const station = Array.from(this.stations.values()).find(
        s => s.macAddress?.toLowerCase() === macAddress.toLowerCase() && s.token === token
      );

      if (!station) {
        return { status: 401, data: { message: 'Unauthorized IoT telemetry source' }, headers: {}, cookies: {} };
      }

      const { papel, plastico, metal } = levels;
      if (typeof papel !== 'number' || typeof plastico !== 'number' || typeof metal !== 'number') {
        return { status: 400, data: { message: 'Levels must be numeric values' }, headers: {}, cookies: {} };
      }

      // Negative readings validation
      if (papel < 0 || plastico < 0 || metal < 0 || (battery !== undefined && battery < 0)) {
        return { status: 400, data: { message: 'Negative sensor readings rejected' }, headers: {}, cookies: {} };
      }

      station.currentLevels = {
        papel: Math.min(papel, 100),
        plastico: Math.min(plastico, 100),
        metal: Math.min(metal, 100),
      };
      if (battery !== undefined) station.battery = battery;

      // Status transition rule: >= 80% on any category triggers WARNING
      const maxFill = Math.max(papel, plastico, metal);
      if (maxFill >= E2E_CONFIG.telemetryWarningThreshold) {
        station.status = 'WARNING';
      } else {
        station.status = 'ACTIVE';
      }
      station.updatedAt = new Date();

      return {
        status: 200,
        data: {
          recorded: true,
          stationId: station.id,
          stationStatus: station.status,
          batteryAlert: battery !== undefined && battery <= 10,
          timestamp: new Date().toISOString(),
        },
        headers: {},
        cookies: {},
      };
    }

    // 7. QR Generation & Verification
    if (route === '/qr/generar' && method === 'POST') {
      const stationToken = headers['x-station-token'];
      if (!stationToken) {
        return { status: 401, data: { message: 'Missing required x-station-token header' }, headers: {}, cookies: {} };
      }

      const station = Array.from(this.stations.values()).find(s => s.token === stationToken);
      if (!station) {
        return { status: 401, data: { message: 'Invalid station token' }, headers: {}, cookies: {} };
      }

      const categoria = body?.categoria || 'Plástico';
      const timestamp = new Date().toISOString();
      const codigo = `QR-${categoria.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'string', 'string'],
        [codigo, categoria, timestamp]
      );
      const wallet = new ethers.Wallet(TEST_CONSTANTS.ADMIN_PRIVATE_KEY);
      const firma = wallet.signMessageSync(ethers.getBytes(messageHash));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const qrRecord: QRTokenRecord = {
        id: `qr-uuid-${Date.now()}`,
        codigo,
        categoria,
        firma,
        usado: false,
        timestamp,
        expiresAt,
      };
      this.qrTokens.set(codigo, qrRecord);

      return {
        status: 201,
        data: {
          codigo,
          categoria,
          firma,
          usado: false,
          timestamp,
          expiresAt,
        },
        headers: {},
        cookies: {},
      };
    }

    if (route === '/qr/verificar' && method === 'GET') {
      const codigo = query['codigo'];
      const firma = query['firma'];

      if (!codigo) {
        return { status: 400, data: { message: 'QR codigo parameter is required' }, headers: {}, cookies: {} };
      }

      const qrRecord = this.qrTokens.get(codigo);
      if (!qrRecord) {
        return { status: 400, data: { message: 'QR no encontrado' }, headers: {}, cookies: {} };
      }
      if (qrRecord.usado) {
        return { status: 400, data: { message: 'QR ya fue usado' }, headers: {}, cookies: {} };
      }
      if (new Date() > new Date(qrRecord.expiresAt)) {
        return { status: 400, data: { message: 'QR vencido' }, headers: {}, cookies: {} };
      }
      if (firma && qrRecord.firma !== firma) {
        return { status: 400, data: { message: 'Firma de QR inválida' }, headers: {}, cookies: {} };
      }

      // Verify ECDSA cryptographic validity
      const isValidSig = verifyEcdsaSignature(
        qrRecord.codigo,
        qrRecord.categoria,
        qrRecord.timestamp,
        qrRecord.firma,
        TEST_CONSTANTS.ADMIN_ADDRESS
      );
      if (!isValidSig) {
        return { status: 400, data: { message: 'Firma criptográfica inválida' }, headers: {}, cookies: {} };
      }

      return {
        status: 200,
        data: {
          codigo: qrRecord.codigo,
          categoria: qrRecord.categoria,
          valido: true,
          mensaje: 'Firma verificada exitosamente',
          puntos: TEST_CONSTANTS.POINTS_PER_CATEGORY[qrRecord.categoria as keyof typeof TEST_CONSTANTS.POINTS_PER_CATEGORY] || 10,
        },
        headers: {},
        cookies: {},
      };
    }

    if (route === '/qr/reclamar' && method === 'POST') {
      if (!authUser) {
        return { status: 401, data: { message: 'Unauthorized: login required to claim tokens' }, headers: {}, cookies: {} };
      }
      const token = body?.token || body?.codigo;
      if (!token) {
        return { status: 400, data: { message: 'Token is required' }, headers: {}, cookies: {} };
      }

      const qrRecord = this.qrTokens.get(token);
      if (!qrRecord) {
        return { status: 400, data: { message: 'QR no encontrado' }, headers: {}, cookies: {} };
      }
      if (qrRecord.usado) {
        return { status: 400, data: { message: 'QR ya fue usado' }, headers: {}, cookies: {} };
      }
      if (new Date() > new Date(qrRecord.expiresAt)) {
        return { status: 400, data: { message: 'QR vencido' }, headers: {}, cookies: {} };
      }

      // Atomic claim mark
      qrRecord.usado = true;
      const puntos = TEST_CONSTANTS.POINTS_PER_CATEGORY[qrRecord.categoria as keyof typeof TEST_CONSTANTS.POINTS_PER_CATEGORY] || 10;

      // Enqueue in BullMQ batch
      this.blockchain.enqueueBatchMint({
        batchId: `BATCH-CLAIM-${Date.now()}`,
        items: [
          {
            recipientAddress: authUser.walletAddress,
            amount: puntos,
            material: qrRecord.categoria,
            claimToken: qrRecord.codigo,
          },
        ],
        timestamp: new Date().toISOString(),
      });

      return {
        status: 200,
        data: {
          success: true,
          puntos,
          txStatus: 'QUEUED',
          message: 'Puntos encolados para minteo en lote vía BullMQ',
        },
        headers: {},
        cookies: {},
      };
    }

    // 8. Clasificación Event
    if (route === '/clasificacion' && method === 'POST') {
      const stationToken = headers['x-station-token'];
      if (!stationToken) {
        return { status: 401, data: { message: 'Missing x-station-token header' }, headers: {}, cookies: {} };
      }
      const station = Array.from(this.stations.values()).find(s => s.token === stationToken);
      if (!station) {
        return { status: 401, data: { message: 'Unauthorized station token' }, headers: {}, cookies: {} };
      }

      const { categoria, confianza, stationId } = body || {};
      if (!categoria || confianza === undefined || !stationId) {
        return { status: 400, data: { message: 'Missing required classification fields' }, headers: {}, cookies: {} };
      }

      const evento: EventoRecord = {
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        categoria,
        confianza,
        stationId,
        timestamp: new Date(),
      };
      this.eventos.push(evento);

      // Automatically generate signed QR for the event
      const timestamp = new Date().toISOString();
      const codigo = `QR-${categoria.toUpperCase()}-${Date.now()}`;
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'string', 'string'],
        [codigo, categoria, timestamp]
      );
      const wallet = new ethers.Wallet(TEST_CONSTANTS.ADMIN_PRIVATE_KEY);
      const firma = wallet.signMessageSync(ethers.getBytes(messageHash));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      this.qrTokens.set(codigo, {
        id: `qr-${Date.now()}`,
        codigo,
        categoria,
        firma,
        usado: false,
        timestamp,
        expiresAt,
      });

      return {
        status: 201,
        data: {
          ...evento,
          qr: {
            codigo,
            categoria,
            firma,
            usado: false,
            timestamp,
            expiresAt,
          },
        },
        headers: {},
        cookies: {},
      };
    }

    if (route === '/clasificacion' && method === 'GET') {
      if (!authUser) {
        return { status: 401, data: { message: 'Unauthorized' }, headers: {}, cookies: {} };
      }
      const page = parseInt(query['page'] || '1', 10);
      const limit = parseInt(query['limit'] || '20', 10);
      if (page <= 0 || limit <= 0) {
        return { status: 400, data: { message: 'Page and limit must be positive' }, headers: {}, cookies: {} };
      }

      const start = (page - 1) * limit;
      const end = start + limit;
      const data = this.eventos.slice(start, end);

      return {
        status: 200,
        data: {
          data,
          total: this.eventos.length,
          page,
          limit,
          totalPages: Math.ceil(this.eventos.length / limit) || 1,
        },
        headers: {},
        cookies: {},
      };
    }

    // 9. Blockchain & Web3
    if (route.startsWith('/blockchain/balance/') && method === 'GET') {
      const address = route.replace('/blockchain/balance/', '');
      if (!ethers.isAddress(address)) {
        return { status: 400, data: { message: 'Invalid Ethereum address format' }, headers: {}, cookies: {} };
      }
      const balance = this.blockchain.balanceOf(address);
      return {
        status: 200,
        data: {
          usuario: address,
          balance,
          simbolo: 'RECI',
        },
        headers: {},
        cookies: {},
      };
    }

    if (route.startsWith('/blockchain/transactions/') && method === 'GET') {
      const address = route.replace('/blockchain/transactions/', '');
      if (!ethers.isAddress(address)) {
        return { status: 400, data: { message: 'Invalid Ethereum address format' }, headers: {}, cookies: {} };
      }
      const txs = this.blockchain.getTransactionsForAddress(address);
      return {
        status: 200,
        data: txs,
        headers: {},
        cookies: {},
      };
    }

    if (route === '/blockchain/batch' && method === 'POST') {
      if (!authUser || authUser.role !== 'ADMIN') {
        return { status: 403, data: { message: 'Forbidden resource: requires ADMIN role' }, headers: {}, cookies: {} };
      }
      const { recipients, amounts } = body || {};
      try {
        const res = this.blockchain.mintBatch(recipients, amounts);
        return { status: 200, data: res, headers: {}, cookies: {} };
      } catch (err: any) {
        return { status: 400, data: { message: err.message }, headers: {}, cookies: {} };
      }
    }

    // 10. Dashboard Metrics
    if (route === '/dashboard/metrics' && method === 'GET') {
      if (!authUser) {
        return { status: 401, data: { message: 'Unauthorized' }, headers: {}, cookies: {} };
      }
      const totalReciclado = this.eventos.length;
      const plasticoCount = this.eventos.filter(e => e.categoria === 'Plástico').length;
      const papelCount = this.eventos.filter(e => e.categoria === 'Papel').length;
      const metalCount = this.eventos.filter(e => e.categoria === 'Metal').length;

      return {
        status: 200,
        data: {
          totalReciclado,
          precisionIA: 96.8,
          ahorroCo2Kg: totalReciclado * 1.5,
          desgloseMateriales: {
            plastico: plasticoCount,
            papel: papelCount,
            metal: metalCount,
          },
          estacionesActivas: Array.from(this.stations.values()).filter(s => s.status === 'ACTIVE').length,
          estacionesAlerta: Array.from(this.stations.values()).filter(s => s.status === 'WARNING').length,
        },
        headers: {},
        cookies: {},
      };
    }

    // Default Not Found
    return {
      status: 404,
      data: { statusCode: 404, message: `Route ${method} ${route} not found`, code: 'NOT_FOUND' },
      headers: {},
      cookies: {},
    };
  }
}
