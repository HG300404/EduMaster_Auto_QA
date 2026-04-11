TARGET=${1:-all}

echo "--- Starting Test Suite: $TARGET ---"
mkdir -p reports

# Step 1: Migration (Always needed for fresh DB)
echo "Step 1: Database Migration..."
python3 tests/infrastructure/migrate_test_db.py

if [ "$TARGET" == "api" ] || [ "$TARGET" == "all" ]; then
    echo "Step 2: API Tests (Pytest)..."
    pytest tests/api --junitxml=reports/api-results.xml || echo "API Tests Failed"
fi

if [ "$TARGET" == "ui" ] || [ "$TARGET" == "all" ]; then
    echo "Step 3: UI Tests (Playwright)..."
    export BASE_URL=http://frontend-test:80
    npx playwright test --config=playwright.config.ts --reporter=line,junit:reports/ui-results.xml || echo "UI Tests Failed"
fi

echo "--- Test Suite Completed: $TARGET ---"
