# [MODIFY] scripts/01_start_env.ps1
Write-Host "Starting EduMaster Test Environment..." -ForegroundColor Cyan

# Thêm --build để đảm bảo các thay đổi trong requirements.txt hoặc Containerfile được áp dụng
# Và bao gồm cả test-runner để nó được chuẩn bị sẵn
podman-compose up -d --build

Write-Host "Environment is starting and building in the background." -ForegroundColor Green
Write-Host "Please wait a moment for the services to become healthy." -ForegroundColor Yellow
