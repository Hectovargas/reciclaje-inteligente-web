/**
 * CleanCity Opaque-Box E2E Test Suite Main Entrypoint
 * Aggregates and executes Tiers 1 through 4 test suites covering all 25 features in PROJECT.md.
 */

import { E2ERunner } from './runner';
import { E2ETestHarness } from './harness/e2e-harness';

// Tier 1 Suites (Features 1 through 25)
import { registerConsolidatedMonorepoTests } from './tier1_features/01_consolidated_monorepo.spec';
import { registerEdgeJwtJoseTests } from './tier1_features/02_edge_jwt_jose.spec';
import { registerRouteProtectionAdminTests } from './tier1_features/03_route_protection_admin.spec';
import { registerRouteProtectionAppTests } from './tier1_features/04_route_protection_app.spec';
import { registerRootRedirectorTests } from './tier1_features/05_root_redirector.spec';
import { registerUnifiedAuthFlowTests } from './tier1_features/06_unified_auth_flow.spec';
import { registerAdminOverviewMetricsTests } from './tier1_features/07_admin_overview_metrics.spec';
import { registerStationInventoryFilteringTests } from './tier1_features/08_station_inventory_filtering.spec';
import { registerStationCreationModalTests } from './tier1_features/09_station_creation_modal.spec';
import { registerStationEditDeleteTests } from './tier1_features/10_station_edit_delete.spec';
import { registerStationDetailTelemetryTests } from './tier1_features/11_station_detail_telemetry.spec';
import { registerZoneDetailViewTests } from './tier1_features/12_zone_detail_view.spec';
import { registerAiDiagnosticsFeedTests } from './tier1_features/13_ai_diagnostics_feed.spec';
import { registerZonesAdminTableTests } from './tier1_features/14_zones_admin_table.spec';
import { registerAdminResponsiveShellTests } from './tier1_features/15_admin_responsive_shell.spec';
import { registerCitizenPwaMainTests } from './tier1_features/16_citizen_pwa_main.spec';
import { registerCameraQrScannerTests } from './tier1_features/17_camera_qr_scanner.spec';
import { registerQrFileAndDemoModesTests } from './tier1_features/18_qr_file_and_demo_modes.spec';
import { registerCryptographicQrClaimTests } from './tier1_features/19_cryptographic_qr_claim.spec';
import { registerWeb3BalanceTransactionsTests } from './tier1_features/20_web3_balance_transactions.spec';
import { registerPwaManifestSwScopeTests } from './tier1_features/21_pwa_manifest_sw_scope.spec';
import { registerOfflineSupportBannerTests } from './tier1_features/22_offline_support_banner.spec';
import { registerLayoutCssScopingTests } from './tier1_features/23_layout_css_scoping.spec';
import { registerStrictDynamicCodeSplittingTests } from './tier1_features/24_strict_dynamic_code_splitting.spec';
import { registerE2eVerificationHarnessTests } from './tier1_features/25_e2e_verification_harness.spec';

// Tier 2 Suites (Boundary & Corner Cases)
import { registerAuthBoundaryTests } from './tier2_boundaries/01_auth_boundary.spec';
import { registerZonesStationsBoundaryTests } from './tier2_boundaries/02_zones_stations_boundary.spec';
import { registerEsp32ActivationBoundaryTests } from './tier2_boundaries/03_esp32_activation_boundary.spec';
import { registerQrReplayBoundaryTests } from './tier2_boundaries/04_qr_replay_boundary.spec';
import { registerTelemetryOverflowBoundaryTests } from './tier2_boundaries/05_telemetry_overflow_boundary.spec';
import { registerBatchMintingBoundaryTests } from './tier2_boundaries/06_batch_minting_boundary.spec';
import { registerBalanceQueryBoundaryTests } from './tier2_boundaries/07_balance_query_boundary.spec';

// Tier 3 Suites (Cross-Feature Combinations)
import { registerTelemetryStationWarningTests } from './tier3_combinations/01_telemetry_station_warning.spec';
import { registerClassificationQrPipelineTests } from './tier3_combinations/02_classification_qr_pipeline.spec';
import { registerAtomicClaimReplayLockoutTests } from './tier3_combinations/03_atomic_claim_replay_lockout.spec';
import { registerUserRegisterWalletBalanceTests } from './tier3_combinations/04_user_register_wallet_balance.spec';
import { registerTokenRevocationIotLockoutTests } from './tier3_combinations/05_token_revocation_iot_lockout.spec';
import { registerBatchWorkerMintConfirmationTests } from './tier3_combinations/06_batch_worker_mint_confirmation.spec';

// Tier 4 Suites (Real-World Workload Scenarios)
import { registerCompleteCitizenJourneyTests } from './tier4_workloads/01_complete_citizen_recycling_journey.spec';
import { registerFraudResistanceJourneyTests } from './tier4_workloads/02_fraud_and_tamper_resistance_journey.spec';
import { registerStationCapacityMaintenanceJourneyTests } from './tier4_workloads/03_station_capacity_maintenance_journey.spec';

async function main() {
  const harness = new E2ETestHarness();

  console.log('Registering CleanCity E2E Test Suites across Tiers 1-4...');

  // Register Tier 1: 25 Features (>=5 tests each = >=125 tests)
  registerConsolidatedMonorepoTests(harness);
  registerEdgeJwtJoseTests(harness);
  registerRouteProtectionAdminTests(harness);
  registerRouteProtectionAppTests(harness);
  registerRootRedirectorTests(harness);
  registerUnifiedAuthFlowTests(harness);
  registerAdminOverviewMetricsTests(harness);
  registerStationInventoryFilteringTests(harness);
  registerStationCreationModalTests(harness);
  registerStationEditDeleteTests(harness);
  registerStationDetailTelemetryTests(harness);
  registerZoneDetailViewTests(harness);
  registerAiDiagnosticsFeedTests(harness);
  registerZonesAdminTableTests(harness);
  registerAdminResponsiveShellTests(harness);
  registerCitizenPwaMainTests(harness);
  registerCameraQrScannerTests(harness);
  registerQrFileAndDemoModesTests(harness);
  registerCryptographicQrClaimTests(harness);
  registerWeb3BalanceTransactionsTests(harness);
  registerPwaManifestSwScopeTests(harness);
  registerOfflineSupportBannerTests(harness);
  registerLayoutCssScopingTests(harness);
  registerStrictDynamicCodeSplittingTests(harness);
  registerE2eVerificationHarnessTests(harness);

  // Register Tier 2: 7 Boundary & Corner Case Suites (>=35 tests)
  registerAuthBoundaryTests(harness);
  registerZonesStationsBoundaryTests(harness);
  registerEsp32ActivationBoundaryTests(harness);
  registerQrReplayBoundaryTests(harness);
  registerTelemetryOverflowBoundaryTests(harness);
  registerBatchMintingBoundaryTests(harness);
  registerBalanceQueryBoundaryTests(harness);

  // Register Tier 3: 6 Cross-Feature Combination Suites (>=20 tests)
  registerTelemetryStationWarningTests(harness);
  registerClassificationQrPipelineTests(harness);
  registerAtomicClaimReplayLockoutTests(harness);
  registerUserRegisterWalletBalanceTests(harness);
  registerTokenRevocationIotLockoutTests(harness);
  registerBatchWorkerMintConfirmationTests(harness);

  // Register Tier 4: 3 Real-World Application Scenario Suites (>=9 tests)
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
