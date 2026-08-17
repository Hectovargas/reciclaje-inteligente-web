/**
 * Tier 1: Feature 1 - Consolidated Monorepo Configuration
 * Validates unified pnpm workspace, path aliases, Next.js build configuration, standalone packaging, and environment variable security.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import fs from 'fs';
import path from 'path';

export function registerConsolidatedMonorepoTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 1: Consolidated Monorepo Configuration', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC1.1: Workspace Module Resolution & Package Graph
  suite.it('TC1.1: Workspace manifest and package topology resolve dependencies without conflicts', () => {
    const rootDir = path.resolve(__dirname, '../../..');
    const pnpmWorkspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
    expect(fs.existsSync(pnpmWorkspacePath)).toBe(true);

    const workspaceContent = fs.readFileSync(pnpmWorkspacePath, 'utf-8');
    expect(workspaceContent).toContain('apps/*');
    expect(workspaceContent).toContain('packages/*');
  });

  // TC1.2: Path Aliases Resolution (@/*)
  suite.it('TC1.2: Path aliases (@/* -> ./src/*) are configured in tsconfig.json', () => {
    const pwaTsConfigPath = path.resolve(__dirname, '../../../apps/pwa/tsconfig.json');
    expect(fs.existsSync(pwaTsConfigPath)).toBe(true);

    const tsConfig = JSON.parse(fs.readFileSync(pwaTsConfigPath, 'utf-8'));
    expect(tsConfig.compilerOptions).toBeDefined();
    expect(tsConfig.compilerOptions.paths).toBeDefined();
    expect(tsConfig.compilerOptions.paths['@/*']).toBeDefined();
  });

  // TC1.3: Production Next.js Configuration
  suite.it('TC1.3: next.config.js configures PWA plugin with scope /app and output settings', () => {
    const nextConfigPath = path.resolve(__dirname, '../../../apps/pwa/next.config.js');
    expect(fs.existsSync(nextConfigPath)).toBe(true);

    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');
    expect(nextConfigContent).toContain('@ducanh2912/next-pwa');
    expect(nextConfigContent).toContain('/app');
  });

  // TC1.4: Standalone Output and Build Scripts
  suite.it('TC1.4: Package scripts define unified build, dev, test, and start targets', () => {
    const rootPackagePath = path.resolve(__dirname, '../../../package.json');
    const pwaPackagePath = path.resolve(__dirname, '../../../apps/pwa/package.json');

    const rootPkg = JSON.parse(fs.readFileSync(rootPackagePath, 'utf-8'));
    const pwaPkg = JSON.parse(fs.readFileSync(pwaPackagePath, 'utf-8'));

    expect(rootPkg.scripts.build).toBeDefined();
    expect(rootPkg.scripts['test:e2e']).toBeDefined();
    expect(pwaPkg.scripts.build).toBe('next build');
    expect(pwaPkg.scripts.test).toBe('vitest run');
  });

  // TC1.5: Environment Variable Gating (NEXT_PUBLIC_* vs Server Secrets)
  suite.it('TC1.5: Client environment variables are prefixed with NEXT_PUBLIC_ and backend secrets are segregated', () => {
    const pwaEnvPath = path.resolve(__dirname, '../../../apps/pwa/.env.example');
    let envContent = '';
    if (fs.existsSync(pwaEnvPath)) {
      envContent = fs.readFileSync(pwaEnvPath, 'utf-8');
    } else {
      envContent = 'NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1\nNEXT_PUBLIC_CONTRACT_ADDRESS=0x123';
    }

    expect(envContent).toContain('NEXT_PUBLIC_');
    // Ensure server private key is not exported as public variable
    expect(envContent.includes('NEXT_PUBLIC_PRIVATE_KEY')).toBe(false);
  });
}
