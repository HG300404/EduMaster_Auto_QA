// @project: EDUMASTER
// @module: Reporting
// @type: UI-E2E

import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { ReportingPage } from '../pages/ReportingPage';

test.describe('Reporting Dashboard Tests', () => {
    test.describe.configure({ timeout: 90000 });

    let loginPage: LoginPage;
    let reportingPage: ReportingPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        reportingPage = new ReportingPage(page);

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    });

    test('should display center overview statistics', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open reports overview page', async () => {
            await reportingPage.goToOverview();
        });

        await uiStep(page, testInfo, 'Verify dashboard statistic cards', async () => {
            await reportingPage.verifyOverviewStatsVisible();
        });
    });

    test('should display revenue trend and lead source charts', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open reports overview page', async () => {
            await reportingPage.goToOverview();
        });

        await uiStep(page, testInfo, 'Verify chart sections render', async () => {
            await reportingPage.verifyRevenueTrendSection();
        });
    });

    test('should display financial revenue report metrics', async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open revenue report page', async () => {
            await reportingPage.goToRevenueReport();
        });

        await uiStep(page, testInfo, 'Verify revenue JSON metrics on UI', async () => {
            await reportingPage.verifyRevenueReportMetrics();
        });
    });
});
