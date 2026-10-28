#!/usr/bin/env bash
# Phase 4 — unified test runner (Linux / CI inside qa-backend container)
set -euo pipefail

TARGET="${1:-smoke}"
WORKDIR="/app/qa_core"
mkdir -p "${WORKDIR}/reports"

run_api() {
  local marker="$1"
  if [[ "${marker}" == "smoke" ]]; then
    pytest tests/api -m smoke \
      --junitxml=reports/api-smoke-results.xml -q --tb=short
  else
    pytest tests/api \
      --junitxml=reports/api-regression-results.xml -q --tb=short
  fi
}

run_ui() {
  local mode="$1"
  if [[ "${mode}" == "smoke" ]]; then
    PLAYWRIGHT_JUNIT_OUTPUT_NAME=reports/ui-smoke-results.xml \
      npx playwright test tests/ui/specs --grep @smoke \
      --workers=1 --reporter=line --reporter=junit
  else
    PLAYWRIGHT_JUNIT_OUTPUT_NAME=reports/ui-regression-results.xml \
      npx playwright test tests/ui/specs \
      --workers=1 --reporter=line --reporter=junit
  fi
}

cd "${WORKDIR}"

case "${TARGET}" in
  smoke)
    echo "--- Smoke: API ---"
    run_api smoke
    echo "--- Smoke: UI ---"
    run_ui smoke
    ;;
  regression|all)
    echo "--- Full regression: API ---"
    run_api regression
    echo "--- Full regression: UI ---"
    run_ui regression
    ;;
  api-smoke)
    run_api smoke
    ;;
  api)
    run_api regression
    ;;
  ui-smoke)
    run_ui smoke
    ;;
  ui)
    run_ui regression
    ;;
  *)
    echo "Usage: $0 [smoke|regression|api-smoke|api|ui-smoke|ui]"
    exit 1
    ;;
esac

echo "--- Done: ${TARGET} ---"
