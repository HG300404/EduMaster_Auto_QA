# scripts/01_start_env.ps1
Write-Host "Starting EduMaster Test Environment..." -ForegroundColor Cyan

# Start all dependencies in the background natively. Test-runner is intentionally omitted.
podman-compose up -d postgres-test backend frontend

Write-Host "Environment is starting in the background." -ForegroundColor Green
Write-Host "Please wait a moment for the services (especially DB) to become fully healthy before running migrations." -ForegroundColor Yellow
