param (
    [string]$TestPath = "tests/api",
    [switch]$Smoke
)

$marker = if ($Smoke) { "-m smoke" } else { "" }
Write-Host "Running API Tests: $TestPath $(if ($Smoke) { '(smoke)' })" -ForegroundColor Cyan

$pytestArgs = @($TestPath, "--junitxml=reports/api-results.xml", "--html=reports/api-report.html", "--self-contained-html")
if ($Smoke) { $pytestArgs = @("-m", "smoke") + $pytestArgs }

podman-compose exec --workdir /app/qa_core qa-backend pytest @pytestArgs

Write-Host "API test execution finished." -ForegroundColor Green
