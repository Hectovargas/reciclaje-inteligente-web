/**
 * CleanCity Opaque-Box E2E Test Suite Main Entrypoint
 * Aggregates and executes Tiers 1 through 4 test suites.
 */

import { E2ERunner } from './runner';
import { E2ETestHarness } from './harness/e2e-harness';

// Tier 1 Suites
import { registerAuthUserTests } from './tier1_features/01_auth_users.spec';
import { registerZoneTests } from './tier1_features/02_zones.spec';
import { registerStationTests } from './tier1_features/03_estaciones.spec';
import { registerEsp32ActivationTests } from './tier1_features/04_esp32_activation.spec';
import { registerQrVerificationTests } from './tier1_features/05_qr_verification.spec';
import { registerIoTTelemetryTests } from './tier1_features/06_iot_telemetry.spec';
import { registerBatchMintingTests } from './tier1_features/07_batch_minting.spec';
import { registerBalanceWeb3Tests } from './tier1_features/08_balance_web3.spec';

// Tier 2 Suites
import { registerAuthBoundaryTests } from './tier2_boundaries/01_auth_boundary.spec';
import { registerZonesStationsBoundaryTests } from './tier2_boundaries/02_zones_stations_boundary.spec';
import { registerEsp32ActivationBoundaryTests } from './tier2_boundaries/03_esp32_activation_boundary.spec';
import { registerQrReplayBoundaryTests } from './tier2_boundaries/04_qr_replay_boundary.spec';
import { registerTelemetryOverflowBoundaryTests } from './tier2_boundaries/05_telemetry_overflow_boundary.spec';
import { registerBatchMintingBoundaryTests } from './tier2_boundaries/06_batch_minting_boundary.spec';
import { registerBalanceQueryBoundaryTests } from './tier2_boundaries/07_balance_query_boundary.spec';

// Tier 3 Suites
import { registerTelemetryStationWarningTests } from './tier3_combinations/01_telemetry_station_warning.spec';
import { registerClassificationQrPipelineTests } from './tier3_combinations/02_classification_qr_pipeline.spec';
import { registerAtomicClaimReplayLockoutTests } from './tier3_combinations/03_atomic_claim_replay_lockout.spec';
import { registerUserRegisterWalletBalanceTests } from './tier3_combinations/04_user_register_wallet_balance.spec';
import { registerTokenRevocationIotLockoutTests } from './tier3_combinations/05_token_revocation_iot_lockout.spec';
import { registerBatchWorkerMintConfirmationTests } from './tier3_combinations/06_batch_worker_mint_confirmation.spec';

// Tier 4 Suites
import { registerCompleteCitizenJourneyTests } from './tier4_workloads/01_complete_citizen_recycling_journey.spec';
import { registerFraudResistanceJourneyTests } from './tier4_workloads/02_fraud_and_tamper_resistance_journey.spec';
import { registerStationCapacityMaintenanceJourneyTests } from './tier4_workloads/03_station_capacity_maintenance_journey.spec';

async function main() {
  const harness = new E2ETestHarness();

  console.log('Registering CleanCity E2E Test Suites across Tiers 1-4...');

  // Register Tier 1 (Feature Coverage)
  registerAuthUserTests(harness);
  registerZoneTests(harness);
  registerStationTests(harness);
  registerEsp32ActivationTests(harness);
  registerQrVerificationTests(harness);
  registerIoTTelemetryTests(harness);
  registerBatchMintingTests(harness);
  registerBalanceWeb3Tests(harness);

  // Register Tier 2 (Boundary & Corner Cases)
  registerAuthBoundaryTests(harness);
  registerZonesStationsBoundaryTests(harness);
  registerEsp32ActivationBoundaryTests(harness);
  registerQrReplayBoundaryTests(harness);
  registerTelemetryOverflowBoundaryTests(harness);
  registerBatchMintingBoundaryTests(harness);
  registerBalanceQueryBoundaryTests(harness);

  // Register Tier 3 (Cross-Feature Combinations)
  registerTelemetryStationWarningTests(harness);
  registerClassificationQrPipelineTests(harness);
  registerAtomicClaimReplayLockoutTests(harness);
  registerUserRegisterWalletBalanceTests(harness);
  registerTokenRevocationIotLockoutTests(harness);
  registerBatchWorkerMintConfirmationTests(harness);

  // Register Tier 4 (Real-World Workload Scenarios)
  registerCompleteCitizenJourneyTests(harness);
  registerFraudResistanceJourneyTests(harness);
  registerStationCapacityMaintenanceJourneyTests(harness);

  // Execute All Suites
  const result = await E2ERunner.runAll();

  if (result.totalFailed > 0) {
    console.error(`\n❌ [FAILURE] ${result.totalFailed} out of ${result.totalTests} tests failed.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 [SUCCESS] All ${result.totalPassed} E2E test cases passed with 100% success rate!`);
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error during E2E test runner execution:', err);
    process.exit(1);
  });
}
