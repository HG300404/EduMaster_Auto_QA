param (
    [string]$SpecPath = "tests/ui/specs",
    [switch]$Smoke
)

$grepArg = if ($Smoke) { "--grep @smoke" } else { "" }
Write-Host "Running UI Tests (Playwright) $(if ($Smoke) { 'smoke' } else { 'full' })" -ForegroundColor Cyan

$cmd = "cd /app/qa_core && npx playwright test $SpecPath $grepArg --workers=1 --config=playwright.config.ts"
podman-compose exec -e BASE_URL=http://frontend:80 qa-backend bash -c $cmd

Write-Host "UI test execution finished." -ForegroundColor Green
