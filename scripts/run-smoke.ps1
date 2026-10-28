# Phase 4 — Smoke regression (business modules, @smoke tags)
# Prerequisites: scripts/01_start_env.ps1 and scripts/02_init_db.ps1

param(
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "=== Smoke Regression (API + UI) ===" -ForegroundColor Cyan

if (-not $SkipSeed) {
    Write-Host "Registering test cases (seed_incremental)..." -ForegroundColor Yellow
    podman exec qa-backend python3 /app/seed_incremental.py
}

Write-Host "Running API smoke (pytest -m smoke)..." -ForegroundColor Yellow
podman exec qa-backend bash -c "cd /app/qa_core && mkdir -p reports && pytest tests/api -m smoke --junitxml=reports/api-smoke-results.xml -q --tb=short"

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running UI smoke (@smoke)..." -ForegroundColor Yellow
podman exec qa-backend bash -c "cd /app/qa_core && PLAYWRIGHT_JUNIT_OUTPUT_NAME=reports/ui-smoke-results.xml npx playwright test tests/ui/specs --grep @smoke --workers=1 --reporter=line --reporter=junit"

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Smoke regression completed ===" -ForegroundColor Green
