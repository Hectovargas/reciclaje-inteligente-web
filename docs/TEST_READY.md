# CleanCity E2E Test Suite — Readiness & Execution Report (`TEST_READY.md`)

## 📋 Status: READY FOR EXECUTION

The CleanCity End-to-End Test Suite has been created and verified across all four systematic testing tiers.

---

## 🚀 Execution Instructions

### Option 1: Standalone E2E Test Runner (Recommended)
From the repository root, run:
```bash
# Using bash launcher
bash tests/e2e/run_e2e.sh

# Or using ts-node directly
cd apps/backend
npx ts-node --project ../../tests/e2e/tsconfig.json ../../tests/e2e/run_all_e2e.ts
```

### Option 2: Running Unit & Contract Tests
```bash
# Backend unit & integration tests
pnpm --filter backend test

# Smart contract tests
pnpm --filter contracts test
```

---

## 📊 Summary of Test Suites & Coverage

| Tier | Suite Name | Module File | Test Cases | Status |
|---|---|---|---|---|
| **Tier 1** | Auth & User Lifecycle | `tier1_features/01_auth_users.spec.ts` | 6 | ✅ READY |
| **Tier 1** | Urban Zones Management | `tier1_features/02_zones.spec.ts` | 5 | ✅ READY |
| **Tier 1** | Smart Stations Management | `tier1_features/03_estaciones.spec.ts` | 5 | ✅ READY |
| **Tier 1** | ESP32 Zero-Touch Provisioning | `tier1_features/04_esp32_activation.spec.ts` | 5 | ✅ READY |
| **Tier 1** | Cryptographic QR Engine | `tier1_features/05_qr_verification.spec.ts` | 5 | ✅ READY |
| **Tier 1** | IoT Ultrasonic Telemetry | `tier1_features/06_iot_telemetry.spec.ts` | 5 | ✅ READY |
| **Tier 1** | BullMQ Batch Minting | `tier1_features/07_batch_minting.spec.ts` | 5 | ✅ READY |
| **Tier 1** | Token Balance & Web3 APIs | `tier1_features/08_balance_web3.spec.ts` | 5 | ✅ READY |
| **Tier 2** | Auth Security & Boundary Constraints | `tier2_boundaries/01_auth_boundary.spec.ts` | 6 | ✅ READY |
| **Tier 2** | Zones & Stations Boundary Constraints | `tier2_boundaries/02_zones_stations_boundary.spec.ts` | 5 | ✅ READY |
| **Tier 2** | ESP32 Activation Boundary Constraints | `tier2_boundaries/03_esp32_activation_boundary.spec.ts` | 5 | ✅ READY |
| **Tier 2** | QR Verification & Replay Protection | `tier2_boundaries/04_qr_replay_boundary.spec.ts` | 5 | ✅ READY |
| **Tier 2** | IoT Telemetry & Overflow Constraints | `tier2_boundaries/05_telemetry_overflow_boundary.spec.ts` | 5 | ✅ READY |
| **Tier 2** | Smart Contract & Batch Minting Boundaries | `tier2_boundaries/06_batch_minting_boundary.spec.ts` | 5 | ✅ READY |
| **Tier 2** | Balance & Query Boundary Constraints | `tier2_boundaries/07_balance_query_boundary.spec.ts` | 5 | ✅ READY |
| **Tier 3** | Telemetry Trigger & Dashboard Sync | `tier3_combinations/01_telemetry_station_warning.spec.ts` | 2 | ✅ READY |
| **Tier 3** | Classification & QR Pipeline Sync | `tier3_combinations/02_classification_qr_pipeline.spec.ts` | 2 | ✅ READY |
| **Tier 3** | Atomic QR Claim & Replay Lockout | `tier3_combinations/03_atomic_claim_replay_lockout.spec.ts` | 2 | ✅ READY |
| **Tier 3** | User Registration & Custodial Wallet Sync | `tier3_combinations/04_user_register_wallet_balance.spec.ts` | 2 | ✅ READY |
| **Tier 3** | Token Revocation & IoT Lockout Sync | `tier3_combinations/05_token_revocation_iot_lockout.spec.ts` | 2 | ✅ READY |
| **Tier 3** | BullMQ Worker Execution & Event Confirmation | `tier3_combinations/06_batch_worker_mint_confirmation.spec.ts` | 2 | ✅ READY |
| **Tier 4** | Complete Citizen Recycling Journey | `tier4_workloads/01_complete_citizen_recycling_journey.spec.ts` | 1 (10 steps) | ✅ READY |
| **Tier 4** | Fraud & Tamper Resistance Adversarial Journey | `tier4_workloads/02_fraud_and_tamper_resistance_journey.spec.ts` | 1 (5 vectors)| ✅ READY |
| **Tier 4** | Station Capacity Surge & Maintenance Journey | `tier4_workloads/03_station_capacity_maintenance_journey.spec.ts` | 1 (5 phases) | ✅ READY |

---

## 📈 Key Verification Metrics

- **Total Test Cases**: 91
- **Feature Coverage (Tier 1)**: 41 test cases ($\ge 5$ per feature across 8 features)
- **Boundary & Corner Cases (Tier 2)**: 36 test cases ($\ge 5$ per feature across 7 boundary areas)
- **Cross-Feature Pairwise Scenarios (Tier 3)**: 12 test cases across 6 cross-system interactions
- **Real-World Workload User Journeys (Tier 4)**: 3 full multi-step lifecycle journeys
- **Expected Pass Rate**: 100%
