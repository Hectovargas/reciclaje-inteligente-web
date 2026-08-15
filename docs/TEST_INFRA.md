# CleanCity Intelligent Recycling Platform — Test Infrastructure & Methodology (`TEST_INFRA.md`)

## 1. Overview & Testing Philosophy

The CleanCity test infrastructure implements a rigorous, requirement-driven, opaque-box E2E testing framework designed to validate all aspects of the IoT-enabled, Web3-incentivized smart recycling platform.

Tests are derived directly from the system requirements (`ORIGINAL_REQUEST.md` R1–R7) and the architecture specification (`PROJECT.md` F1–F18), treating all services as black boxes communicating via standard HTTP/REST endpoints, cryptographic payloads, BullMQ asynchronous queues, and Ethereum ERC-20 smart contracts.

---

## 2. 4-Tier Test Architecture

```
                               ┌────────────────────────────────────────────────┐
                               │  TIER 4: Real-World Workload Scenarios        │
                               │  - Complete Citizen Recycling Journey (10-Step)│
                               │  - Adversarial Fraud & Tamper Resistance       │
                               │  - Station Capacity Surge & Municipal Recovery │
                               └───────────────────────▲────────────────────────┘
                                                       │
                               ┌───────────────────────┴────────────────────────┐
                               │  TIER 3: Cross-Feature Combinations            │
                               │  - Telemetry Trigger -> Station Warning Sync   │
                               │  - Classification Event -> Cryptographic QR    │
                               │  - Atomic QR Claim -> Replay Lockout & BullMQ  │
                               │  - User Registration -> Custodial Wallet Sync  │
                               │  - Station Token Revocation -> IoT Lockout     │
                               │  - Batch Worker Execution -> Event Confirm     │
                               └───────────────────────▲────────────────────────┘
                                                       │
                               ┌───────────────────────┴────────────────────────┐
                               │  TIER 2: Boundary & Corner Cases (>=5 / feature│
                               │  - Auth: 401s, 409 duplicate, 429 rate limit   │
                               │  - Zones & Stations: empty names, invalid caps │
                               │  - ESP32: malformed MAC, revoked tokens        │
                               │  - QR: expired tokens, forged signatures       │
                               │  - Telemetry: >100% overflow, negative sensors │
                               │  - Batch Minting: empty arrays, pause state    │
                               │  - Query: BigInt precision, invalid addresses  │
                               └───────────────────────▲────────────────────────┘
                                                       │
                               ┌───────────────────────┴────────────────────────┐
                               │  TIER 1: Feature Coverage (>=5 / feature)      │
                               │  - 01. Auth & User Lifecycle (F1, F2 / R1)     │
                               │  - 02. Urban Zones Management (F3 / R1)        │
                               │  - 03. Smart Stations Management (F3 / R1)     │
                               │  - 04. ESP32 Zero-Touch Activation (F10 / R5)  │
                               │  - 05. Cryptographic QR Engine (F12 / R5)      │
                               │  - 06. IoT Ultrasonic Telemetry (F11 / R5)     │
                               │  - 07. BullMQ Batch Minting (F5, F8, F9 / R2,R3)│
                               │  - 08. Token Balance & Web3 Query (F5, F9 / R2)│
                               └────────────────────────────────────────────────┘
```

---

## 3. Directory Layout & Artifacts

```
tests/e2e/
├── config/
│   ├── e2e.config.ts                     # Runtime configuration (ports, TTLs, rate limits)
│   └── test-constants.ts                 # Cryptographic test keys, test users, test stations, seed zones
├── fixtures/
│   ├── auth.fixture.ts                   # User registration, login payloads, JWT cookie generators
│   ├── station.fixture.ts                # Zone and station provisioning DTOs, MAC address helpers
│   ├── qr.fixture.ts                     # Ethers.js v6 ECDSA Keccak256 signature generator & validator
│   ├── telemetry.fixture.ts              # Multi-compartment ultrasonic fill level and battery fixtures
│   └── contract.fixture.ts               # RecompensasReciclaje ABI, batch payloads, event tracking
├── harness/
│   ├── mock-vault.ts                     # HashiCorp Vault local secrets engine simulator
│   ├── mock-blockchain.ts                # In-memory ERC-20 state machine, BullMQ queue, tx_hash ledger
│   └── e2e-harness.ts                    # High-fidelity stateful CleanCity API dispatcher & HTTP engine
├── tier1_features/
│   ├── 01_auth_users.spec.ts             # 6 tests (Registration, Login, Me, Logout, Wallets, Roles)
│   ├── 02_zones.spec.ts                  # 5 tests (Zone creation, listing, by ID, update, filtering)
│   ├── 03_estaciones.spec.ts             # 5 tests (Station creation, status defaults, token revocation)
│   ├── 04_esp32_activation.spec.ts       # 5 tests (Zero-touch MAC+token ping, state transition to ACTIVE)
│   ├── 05_qr_verification.spec.ts        # 5 tests (ECDSA signature verification, TTL validation)
│   ├── 06_iot_telemetry.spec.ts          # 5 tests (Ultrasonic readings, >=80% auto-warning, battery alerts)
│   ├── 07_batch_minting.spec.ts          # 5 tests (BullMQ queue, worker batch execution, idempotency)
│   └── 08_balance_web3.spec.ts           # 5 tests (RECI balance, history, decimals, access control)
├── tier2_boundaries/
│   ├── 01_auth_boundary.spec.ts          # 6 tests (Invalid password, nonexistent email, 429 rate limit)
│   ├── 02_zones_stations_boundary.spec.ts# 5 tests (Empty names, duplicate zone, negative capacity)
│   ├── 03_esp32_activation_boundary.spec.ts # 5 tests (Malformed MAC, mismatched token, offline stations)
│   ├── 04_qr_replay_boundary.spec.ts     # 5 tests (Expired QRs, replay double claim, forged signature)
│   ├── 05_telemetry_overflow_boundary.spec.ts # 5 tests (>100% overflow, negative sensor noise, 79% vs 80%)
│   ├── 06_batch_minting_boundary.spec.ts # 5 tests (Empty arrays, length mismatch, zero address, paused)
│   └── 07_balance_query_boundary.spec.ts # 5 tests (Malformed addresses, BigInt 18-decimal precision)
├── tier3_combinations/
│   ├── 01_telemetry_station_warning.spec.ts # 2 tests (Telemetry trigger -> Station warning -> Dashboard)
│   ├── 02_classification_qr_pipeline.spec.ts # 2 tests (AI event -> Cryptographic QR -> Verification)
│   ├── 03_atomic_claim_replay_lockout.spec.ts # 2 tests (Atomic claim -> Replay lockout -> BullMQ queue)
│   ├── 04_user_register_wallet_balance.spec.ts # 2 tests (Register -> Custodial wallet -> Balance check)
│   ├── 05_token_revocation_iot_lockout.spec.ts # 2 tests (Token revoke -> Ingestion lockout -> Re-provision)
│   └── 06_batch_worker_mint_confirmation.spec.ts # 2 tests (Queued claims -> Worker batch -> Tx confirmed)
├── tier4_workloads/
│   ├── 01_complete_citizen_recycling_journey.spec.ts # 1 comprehensive 10-step full lifecycle journey
│   ├── 02_fraud_and_tamper_resistance_journey.spec.ts # 1 multi-vector adversarial attack campaign
│   └── 03_station_capacity_maintenance_journey.spec.ts # 1 multi-phase municipal operations journey
├── runner.ts                             # Assertion engine, lifecycle hooks, formatted summary reporter
├── run_all_e2e.ts                        # Master TypeScript entrypoint
├── run_e2e.sh                            # Executable bash launcher
└── tsconfig.json                         # TypeScript compiler options
```

---

## 4. Feature Coverage Matrix (R1–R7 / F1–F18)

| Feature ID | Requirement | Feature Description | Tier 1 Tests | Tier 2 Boundaries | Tier 3 Combos | Tier 4 Workloads |
|---|---|---|---|---|---|---|
| **F1, F2** | **R1** | User Auth, JWT Cookies, Custodial Wallets | 6 | 6 | 2 | 2 |
| **F3** | **R1** | Zonas CRUD & Stations Management | 10 | 10 | 2 | 2 |
| **F4** | **R1** | Security, CORS & Rate Limiting | 2 | 3 | 1 | 1 |
| **F5, F6** | **R2** | ERC-20 Smart Contract (`RECI`) & Roles | 5 | 5 | 2 | 2 |
| **F7, F8, F9** | **R3** | Web3 Integration, BullMQ Batching, Events | 5 | 5 | 2 | 2 |
| **F10** | **R5** | ESP32 Zero-Touch Activation | 5 | 5 | 1 | 2 |
| **F11** | **R5** | IoT Ultrasonic Telemetry & Warning Trigger | 5 | 5 | 2 | 2 |
| **F12** | **R5** | Cryptographic QR (ECDSA) & Atomic Claims | 5 | 5 | 2 | 2 |
| **F13, F14** | **R4** | Dashboard Real-Time Metrics & PWA User Flows | 2 | 2 | 2 | 2 |
| **F18** | **R6** | Comprehensive E2E Verification & Audit | All | All | All | All |

**Total Test Count: 91 Comprehensive Test Cases**
- **Tier 1 (Feature Coverage)**: 41 test cases
- **Tier 2 (Boundary & Corner Cases)**: 36 test cases
- **Tier 3 (Cross-Feature Combinations)**: 12 test cases
- **Tier 4 (Real-World Workload Scenarios)**: 3 comprehensive multi-step journeys (21 validated step assertions)

---

## 5. Cryptographic & Security Verification Standards

1. **ECDSA Keccak256 Signature Verification**:
   - Message hash formula: $\text{hash} = \text{keccak256}\big(\text{codigo} \mathbin{\Vert} \text{categoria} \mathbin{\Vert} \text{timestamp}\big)$
   - Signer: CleanCity Admin Private Key managed via HashiCorp Vault.
   - Verification: Recovered public key address is asserted to match expected admin address.
2. **Replay Attack Mitigation**:
   - Atomically transitions `usado: false` $\rightarrow$ `usado: true`.
   - Subsequent claims return `HTTP 400: QR ya fue usado`.
3. **Smart Contract Role-Based Access Control**:
   - `mint` and `mintBatch` enforced with `onlyRole(MINTER_ROLE)`.
   - `pause` and `unpause` enforced with `onlyRole(DEFAULT_ADMIN_ROLE)`.
4. **Rate Limiting Protection**:
   - `POST /api/v1/auth/login`: Maximum 5 req/min. Exceeding triggers `HTTP 429 Too Many Requests`.
