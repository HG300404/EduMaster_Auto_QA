# scripts/05_teardown.ps1
Write-Host "Stopping and Removing Test Environment..." -ForegroundColor Yellow

# Stop and remove all containers, networks, and volumes related to the test environment
podman-compose down -v

Write-Host "Test environment fully terminated." -ForegroundColor Green
