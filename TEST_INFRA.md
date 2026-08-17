# CleanCity EcoGridAI — Test Infrastructure & E2E Test Suite Specification

## 1. Executive Summary & Test Architecture

This document defines the complete testing infrastructure, opaque-box E2E test suite, and quality assurance framework for the **CleanCity EcoGridAI** intelligent municipal recycling ecosystem.

The test architecture ensures zero-regression verification across the entire technology stack:
- **Backend**: NestJS REST API, Prisma ORM, PostgreSQL, Redis / BullMQ, Vault secrets engine.
- **Frontend / PWA**: Next.js 14 App Router, Citizen PWA (`/app`), Admin Command Center (`/admin`), Dynamic imports, Service Worker offline caching.
- **Blockchain**: Solidity Smart Contract (`RecompensasReciclaje.sol` ERC-20), Batch Minting Worker (`mintBatch`), Custodial Ethereum Wallets (`ethers.js v6`).
- **IoT & Hardware**: ESP32 Microcontroller firmware simulation, ultrasonic fill level telemetry, cryptographic QR generation (`ECDSA secp256k1` / `keccak256`).

```
+---------------------------------------------------------------------------------------------+
|                               CleanCity E2E Test Architecture                               |
+---------------------------------------------------------------------------------------------+
|                                                                                             |
|   +-------------------------------------------------------------------------------------+   |
|   |                       Tier 4: Real-World Workload Scenarios                         |   |
|   |   - Journey 1: Full 10-Step Citizen Recycling, Hardware Provisioning & Minting      |   |
|   |   - Journey 2: Fraud & Tamper Resistance Adversarial Attack Campaigns               |   |
|   |   - Journey 3: Municipal Operations & Capacity Surge Saturation/Recovery            |   |
|   +-------------------------------------------------------------------------------------+   |
|                                            ^                                                |
|   +-------------------------------------------------------------------------------------+   |
|   |                     Tier 3: Cross-Feature Combinations (Pairwise)                   |   |
|   |   - Combo 1: Telemetry Trigger & Dashboard Sync                                     |   |
|   |   - Combo 2: AI Classification & Cryptographic QR Verification Pipeline             |   |
|   |   - Combo 3: Atomic QR Claim & Double-Spend Replay Lockout                          |   |
|   |   - Combo 4: Citizen Registration & Custodial Wallet Sync                           |   |
|   |   - Combo 5: Station Token Revocation & IoT Ingestion Lockout                       |   |
|   |   - Combo 6: BullMQ Worker Execution & Event Confirmation Sync                      |   |
|   +-------------------------------------------------------------------------------------+   |
|                                            ^                                                |
|   +-------------------------------------------------------------------------------------+   |
|   |                     Tier 2: Boundary, Corner & Edge Cases                           |   |
|   |   - Auth & RBAC Boundaries (Rate Limits, Expired Cookies, Malformed Emails)         |   |
|   |   - Zone & Station Constraints (Duplicate names, Negative Capacity, Zero UUIDs)     |   |
|   |   - Hardware Activation Limits (Malformed MACs, Decommissioned Stations)            |   |
|   |   - QR Cryptographic Limits (Forged Signatures, Replays, TTL Expiry)                |   |
|   |   - Sensor Overflow Clamping (Negative readings, >100% clamping, Low Battery)       |   |
|   |   - Smart Contract Boundaries (ZeroAddress, Paused Contract, Unauthorized Caller)   |   |
|   |   - BigInt Precision & Pagination Limits (18-decimal accuracy, page=0)              |   |
|   +-------------------------------------------------------------------------------------+   |
|                                            ^                                                |
|   +-------------------------------------------------------------------------------------+   |
|   |                 Tier 1: 25-Feature Inventory Coverage (>=5 Tests Each)              |   |
|   |   - Features 1 to 25 (125 Total Comprehensive Test Cases)                           |   |
|   +-------------------------------------------------------------------------------------+   |
|                                                                                             |
|   +-------------------------------------------------------------------------------------+   |
|   |                         High-Fidelity Test Harness & Mock Engines                   |   |
|   |   - E2ETestHarness (REST Router, Edge RBAC, In-Memory DB, Session Manager)          |   |
|   |   - MockBlockchainEngine (ERC-20 Sim, AccessControl, BullMQ Queue, BigInt Math)     |   |
|   |   - MockVaultEngine (AES-256-GCM Encryption, JWT Signing & Decoding, Secrets KV)    |   |
|   +-------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------+
```

---

## 2. Monorepo Alignment & Ethers.js v6 Compatibility

### Root Cause of Previous Monorepo Conflicts
Prior to consolidation, `apps/pwa/package.json` specified `"ethers": "^5.7.2"`, while backend services and E2E test suites relied on the modern **Ethers.js v6 API**. This caused `pnpm` to hoist Ethers v5 to root `node_modules/ethers`, leading to compilation and runtime breakages (`ethers.solidityPackedKeccak256`, `ethers.getBytes`, `ethers.isAddress` missing).

### Resolution Implemented
1. **Root Dependency Alignment**: Added `"ethers": "^6.11.1"` to root `devDependencies` and workspace `overrides`.
2. **PWA Package Update**: Upgraded `apps/pwa/package.json` from `^5.7.2` to `"ethers": "^6.11.1"`.
3. **Workspace Configuration (`pnpm-workspace.yaml`)**:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   overrides:
     ethers: "^6.11.1"
   ```
4. **Root Test Script Unified Entrypoints**:
   - `pnpm test:e2e`: Runs full 194 E2E test suite via `tests/e2e/run_all_e2e.ts`.
   - `pnpm test:backend`: Runs NestJS backend unit and integration tests.
   - `pnpm test:pwa`: Runs PWA frontend component and unit tests.
   - `pnpm test`: Executes complete monorepo test pipeline.

---

## 3. 25-Feature Inventory Test Matrix

The following matrix documents the complete 25-feature inventory specified in `PROJECT.md`, mapping each feature to its dedicated test suite in `tests/e2e/tier1_features/`, with primary test cases, API routes, and verification criteria.

| ID | Feature Name | Test File | Test Cases | API Routes / Contracts Verified |
|---|---|---|---|---|
| **F01** | Consolidated Monorepo Configuration | `01_consolidated_monorepo.spec.ts` | TC1.1 – TC1.5 (5) | `pnpm-workspace.yaml`, `package.json` scripts, `tsconfig.json` path aliases |
| **F02** | Edge JWT Verification (`jose`) | `02_edge_jwt_jose.spec.ts` | TC2.1 – TC2.5 (5) | Edge Middleware, HS256 JWT signature, claims decoding, expiry intercept |
| **F03** | Route Protection (`/admin/**`) | `03_route_protection_admin.spec.ts` | TC3.1 – TC3.5 (5) | `/admin/**`, RBAC role gating (`role === 'ADMIN'`), `callbackUrl` preservation |
| **F04** | Route Protection (`/app/**`) | `04_route_protection_app.spec.ts` | TC4.1 – TC4.5 (5) | `/app/**`, Citizen role gating (`role === 'USER'`), unauth 307 redirects |
| **F05** | Root Conditional Redirector (`/`) | `05_root_redirector.spec.ts` | TC5.1 – TC5.5 (5) | `/` -> `/admin` (Admin), `/` -> `/app` (Citizen), `/` -> `/login` (Guest) |
| **F06** | Unified Auth Flow & Session Check | `06_unified_auth_flow.spec.ts` | TC6.1 – TC6.5 (5) | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| **F07** | Admin Overview View (`/admin`) | `07_admin_overview_metrics.spec.ts` | TC7.1 – TC7.5 (5) | `GET /dashboard/metrics`, KPI counters, CO2 projections, active alert badges |
| **F08** | Station Inventory & Filtering | `08_station_inventory_filtering.spec.ts` | TC8.1 – TC8.5 (5) | `GET /estaciones`, status filters (`active`, `warning`, `pending_activation`) |
| **F09** | Zero-Touch Station Creation Modal | `09_station_creation_modal.spec.ts` | TC9.1 – TC9.5 (5) | `POST /estaciones`, MAC validation, provisioning token generation |
| **F10** | Station Edit & Deletion Modals | `10_station_edit_delete.spec.ts` | TC10.1 – TC10.5 (5) | `PUT /estaciones/:id`, `DELETE /estaciones/:id`, cascade verification |
| **F11** | Station Detail & Telemetry View | `11_station_detail_telemetry.spec.ts` | TC11.1 – TC11.5 (5) | `POST /iot/telemetria`, `POST /estaciones/:id/revoke-token`, ultrasonic gauges |
| **F12** | Zone Detail View (`/admin/zonas/[id]`) | `12_zone_detail_view.spec.ts` | TC12.1 – TC12.5 (5) | `GET /zonas/:id`, filtered station grids, zone analytics |
| **F13** | AI Diagnostics Feed (`/admin/diagnostico-ia`) | `13_ai_diagnostics_feed.spec.ts` | TC13.1 – TC13.5 (5) | `POST /clasificacion`, `GET /clasificacion?page=&limit=`, confidence filters |
| **F14** | Zones Administration (`/admin/zonas-admin`) | `14_zones_admin_table.spec.ts` | TC14.1 – TC14.5 (5) | `GET /zonas`, `POST /zonas`, `PATCH /zonas/:id` active/inactive toggle |
| **F15** | Admin Responsive Shell | `15_admin_responsive_shell.spec.ts` | TC15.1 – TC15.5 (5) | Desktop sidebar, mobile drawer, profile modal hydration, logout trigger |
| **F16** | Citizen PWA Main View (`/app`) | `16_citizen_pwa_main.spec.ts` | TC16.1 – TC16.5 (5) | BalanceCard, QrScanner tab, ClaimModal integration, TransactionHistory |
| **F17** | Camera QR Scanner (`html5-qrcode`) | `17_camera_qr_scanner.spec.ts` | TC17.1 – TC17.5 (5) | `GET /qr/verificar`, scanner decoding lifecycle, signature check |
| **F18** | QR Scanner File Upload & Demo Modes | `18_qr_file_and_demo_modes.spec.ts` | TC18.1 – TC18.5 (5) | Demo presets (+10 Plástico, +15 Metal, +5 Papel, +8 Vidrio), manual input |
| **F19** | Cryptographic QR Claim Flow | `19_cryptographic_qr_claim.spec.ts` | TC19.1 – TC19.5 (5) | `POST /qr/reclamar`, atomic state transition, replay lockout |
| **F20** | Web3 Custodial Balance & Transactions | `20_web3_balance_transactions.spec.ts` | TC20.1 – TC20.5 (5) | `GET /blockchain/balance/:addr`, `GET /blockchain/transactions/:addr` |
| **F21** | PWA Manifest & Service Worker Scope | `21_pwa_manifest_sw_scope.spec.ts` | TC21.1 – TC21.5 (5) | `GET /manifest.json`, `next.config.js` withPWA scope `/app`, admin bypass |
| **F22** | Offline Support & Fallback Banner | `22_offline_support_banner.spec.ts` | TC22.1 – TC22.5 (5) | `/offline` route, OfflineBanner listener, cached session persistence |
| **F23** | Layout CSS Scoping | `23_layout_css_scoping.spec.ts` | TC23.1 – TC23.5 (5) | `admin.css` scoping in `/admin`, `pwa.css` scoping (480px) in `/app` |
| **F24** | Strict Dynamic Code-Splitting | `24_strict_dynamic_code_splitting.spec.ts` | TC24.1 – TC24.5 (5) | `chart.js` zero-bleed in `/app`, dynamic `Html5Qrcode` scanner loading |
| **F25** | Comprehensive Verification & E2E Tests | `25_e2e_verification_harness.spec.ts` | TC25.1 – TC25.5 (5) | Test runner matchers, mock blockchain engine, AES-256-GCM vault engine |

---

## 4. Multi-Tier Test Suite Hierarchy (194 Tests Total)

```
tests/e2e/
├── config/
│   └── test-constants.ts                     # Environment constants, deterministic test accounts, addresses
├── fixtures/
│   ├── auth.fixture.ts                       # Auth payloads, login/register generators
│   ├── station.fixture.ts                    # Zone and Station payloads
│   ├── telemetry.fixture.ts                  # IoT ultrasonic and battery payloads
│   ├── qr.fixture.ts                         # Cryptographic ECDSA QR generator & tamper utilities
│   └── contract.fixture.ts                   # Blockchain event records and BullMQ job types
├── harness/
│   ├── e2e-harness.ts                        # Master test harness, route dispatcher, Edge middleware simulation
│   ├── mock-blockchain.ts                    # High-fidelity ERC-20 & BullMQ batch minting engine
│   └── mock-vault.ts                         # AES-256-GCM encryption & HS256 JWT vault engine
├── tier1_features/                           # 25 Suites (Features 1-25) — 125 Test Cases
│   ├── 01_consolidated_monorepo.spec.ts
│   ├── 02_edge_jwt_jose.spec.ts
│   ├── ...
│   └── 25_e2e_verification_harness.spec.ts
├── tier2_boundaries/                         # 7 Suites — 36 Test Cases
│   ├── 01_auth_boundary.spec.ts
│   ├── 02_zones_stations_boundary.spec.ts
│   ├── 03_esp32_activation_boundary.spec.ts
│   ├── 04_qr_replay_boundary.spec.ts
│   ├── 05_telemetry_overflow_boundary.spec.ts
│   ├── 06_batch_minting_boundary.spec.ts
│   └── 07_balance_query_boundary.spec.ts
├── tier3_combinations/                       # 6 Suites — 24 Test Cases
│   ├── 01_telemetry_station_warning.spec.ts
│   ├── 02_classification_qr_pipeline.spec.ts
│   ├── 03_atomic_claim_replay_lockout.spec.ts
│   ├── 04_user_register_wallet_balance.spec.ts
│   ├── 05_token_revocation_iot_lockout.spec.ts
│   └── 06_batch_worker_mint_confirmation.spec.ts
├── tier4_workloads/                          # 3 Suites — 9 Test Cases
│   ├── 01_complete_citizen_recycling_journey.spec.ts
│   ├── 02_fraud_and_tamper_resistance_journey.spec.ts
│   └── 03_station_capacity_maintenance_journey.spec.ts
├── runner.ts                                 # Standalone assertion library & colored test runner
├── run_all_e2e.ts                            # Aggregated entrypoint registering all 194 tests
├── run_e2e.sh                                # Execution shell script with ts-node
└── tsconfig.json                             # Isolated TypeScript config
```

### Breakdown of Test Distribution
- **Tier 1 (Feature Coverage)**: 25 suites × 5 tests = **125 test cases**
- **Tier 2 (Boundary & Corner Cases)**: 7 suites = **36 test cases**
- **Tier 3 (Cross-Feature Combinations)**: 6 suites × 4 tests = **24 test cases**
- **Tier 4 (Real-World Scenarios)**: 3 suites × 3 tests = **9 test cases**
- **Total Test Cases**: **194 test cases** (100% pass rate)

---

## 5. Mock State & Cryptographic Engine Specifications

### 1. `E2ETestHarness`
- **Stateful In-Memory Storage**: Isolated `Map<string, UserRecord>`, `Map<string, ZoneRecord>`, `Map<string, StationRecord>`, `Map<string, QRTokenRecord>`, and `eventos: AIClassificationRecord[]`.
- **Request Dispatcher**: Handles full REST contracts for `/auth/*`, `/zonas/*`, `/estaciones/*`, `/iot/*`, `/clasificacion/*`, `/qr/*`, `/blockchain/*`, `/dashboard/*`, and `/manifest.json`.
- **Edge Middleware Simulator (`simulateEdgeMiddleware`)**: Simulates Next.js Edge runtime cookie extraction, JWT signature verification via `MockVaultEngine`, path matching, and 307 role-based redirects.

### 2. `MockBlockchainEngine`
- **ERC-20 Token Engine**: Implements standard OpenZeppelin ERC-20 + AccessControl semantics with 18-decimal `BigInt` precision math.
- **Batch Minting**: `mintBatch(recipients[], amounts[])` with array length validation, zero-address rejection, and `MINTER_ROLE` access control.
- **BullMQ Simulation**: `enqueueBatchMint` and `processBullMqBatch` with claim token idempotency deduplication.

### 3. `MockVaultEngine`
- **AES-256-GCM Private Key Encryption**: Authenticated encryption of custodial wallet keys with 128-bit initialization vectors (`iv`) and authentication tags (`authTag`).
- **Cryptographic JWT Engine**: Signs and validates HS256 JWT tokens with expiry checks (`exp`) and role claims.

---

## 6. Test Execution Instructions

### Running the E2E Suite via npm / pnpm
```bash
# Execute the full 194-test E2E suite
pnpm test:e2e

# Or using npm
npm run test:e2e
```

### Running via Shell Script
```bash
bash tests/e2e/run_e2e.sh
```

### Running Specific Milestone / Targeted Test Suites
```bash
# Run backend tests
pnpm test:backend

# Run PWA tests
pnpm test:pwa

# Run all monorepo test suites
pnpm test
```

### Continuous Integration (CI) Quality Gates
The test runner exits with code `0` on 100% pass rate and code `1` on any assertion failure, ensuring seamless integration with GitHub Actions, GitLab CI, and deployment pipelines.
