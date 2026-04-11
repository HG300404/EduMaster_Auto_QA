# scripts/04_run_ui.ps1
param (
    [string]$SpecPath = "" # Optional path to target specific spec file
)

Write-Host "Running UI Tests (Playwright)" -ForegroundColor Cyan

# Run playwright tests inside the ephemeral test-runner container
podman-compose run --rm -e BASE_URL=http://frontend:80 test-runner npx playwright test $SpecPath --config=playwright.config.ts

Write-Host "UI test execution finished." -ForegroundColor Green
