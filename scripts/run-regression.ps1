# Phase 4 — Full regression (all API + all UI specs)
# Prerequisites: scripts/01_start_env.ps1 and scripts/02_init_db.ps1

param(
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "=== Full Regression (API + UI) ===" -ForegroundColor Cyan

if (-not $SkipSeed) {
    Write-Host "Registering test cases (seed_incremental)..." -ForegroundColor Yellow
    podman exec qa-backend python3 /app/seed_incremental.py
}

Write-Host "Running all API tests..." -ForegroundColor Yellow
podman exec qa-backend bash -c "cd /app/qa_core && mkdir -p reports && pytest tests/api --junitxml=reports/api-regression-results.xml --html=reports/api-regression-report.html --self-contained-html -q --tb=short"

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running all UI specs..." -ForegroundColor Yellow
podman exec qa-backend bash -c "cd /app/qa_core && PLAYWRIGHT_JUNIT_OUTPUT_NAME=reports/ui-regression-results.xml npx playwright test tests/ui/specs --workers=1 --reporter=line --reporter=junit"

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Full regression completed ===" -ForegroundColor Green
