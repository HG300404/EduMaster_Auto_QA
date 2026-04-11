# scripts/03_run_api.ps1
param (
    [string]$TestPath = "tests/api" # Default to all API tests if no argument is provided
)

Write-Host "Running API Tests: $($TestPath)" -ForegroundColor Cyan

# Run pytest inside the ephemeral test-runner container
podman-compose run --rm test-runner pytest $TestPath --junitxml=reports/api-results.xml

Write-Host "API test execution finished." -ForegroundColor Green
