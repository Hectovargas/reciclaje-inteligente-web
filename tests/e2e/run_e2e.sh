#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(dirname "$(dirname "$DIR")")"

echo "============================================================"
echo "⚡ CleanCity E2E Test Suite Launcher"
echo "============================================================"

# Navigate to backend to leverage installed dependencies (ts-node, ethers, etc.)
cd "$ROOT_DIR/apps/backend"

echo "Running E2E tests via ts-node..."
npx ts-node --project "$DIR/tsconfig.json" "$DIR/run_all_e2e.ts"

echo "E2E Test Execution finished successfully."
