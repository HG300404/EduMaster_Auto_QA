import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
    const logPath = '/app/reports/browser-logs.txt';
    if (!fs.existsSync(path.dirname(logPath))) {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }
    page.on('console', msg => {
        fs.appendFileSync(logPath, `[${msg.type()}] ${msg.text()}\n`);
    });
});

test.describe('Login Flow', () => {
    test('should login successfully with valid credentials', async ({ page }, testInfo) => {
        const loginPage = new LoginPage(page);

        await uiStep(page, testInfo, 'Open login page', async () => {
            await loginPage.navigate();
        });

        await uiStep(page, testInfo, 'Submit valid admin credentials', async () => {
            await loginPage.login('admin@edumaster.com', 'admin123');
        });

        await uiStep(page, testInfo, 'Verify redirect to admin dashboard', async () => {
            await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
            await expect(page.getByText('Dashboard Overview')).toBeVisible({ timeout: 10000 });
        });
    });

    test('should show error with invalid credentials', async ({ page }, testInfo) => {
        const loginPage = new LoginPage(page);

        await uiStep(page, testInfo, 'Open login page', async () => {
            await loginPage.navigate();
        });

        await uiStep(page, testInfo, 'Submit invalid credentials', async () => {
            const responsePromise = page.waitForResponse(
                (response) => response.url().includes('/api/auth/login') && response.status() === 401
            );
            await loginPage.fillCredentials('wrong@example.com', 'wrongpass');
            await loginPage.submitLoginForm();
            await responsePromise;
            await page.waitForTimeout(2000);
        });

        await uiStep(page, testInfo, 'Verify login error message', async () => {
            await expect(page.locator('body')).toContainText(/failed|credentials|invalid/i, {
                timeout: 15000,
            });
        });
    });

    test('should show validation errors for empty fields', async ({ page }, testInfo) => {
        const loginPage = new LoginPage(page);

        await uiStep(page, testInfo, 'Open login page', async () => {
            await loginPage.navigate();
        });

        await uiStep(page, testInfo, 'Clear fields and submit empty form', async () => {
            await page.getByPlaceholder('Email').clear();
            await page.getByPlaceholder('Password').clear();
            await page.getByRole('button', { name: 'Log in' }).click();
        });

        await uiStep(page, testInfo, 'Verify validation error messages', async () => {
            await expect(page.getByText('Please input your Email!')).toBeVisible();
            await expect(page.getByText('Please input your Password!')).toBeVisible();
        });
    });
});
