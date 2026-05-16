# scripts/02_init_db.ps1
Write-Host "Initializing Test Database..." -ForegroundColor Cyan

# Run the migration script inside the ALREADY RUNNING backend container
podman exec edumaster-backend-test flask db upgrade

Write-Host "Database initialization (migrations) completed." -ForegroundColor Green
