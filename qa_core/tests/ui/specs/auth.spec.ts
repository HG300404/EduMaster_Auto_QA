import { test, expect } from '@playwright/test';
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
    test('should login successfully with valid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await loginPage.login('admin@edumaster.com', 'admin123');
        
        // Assert redirect to admin dashboard
        await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
        await expect(page.getByText('Dashboard Overview')).toBeVisible({ timeout: 10000 });
    });

    test('should show error with invalid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        
        const responsePromise = page.waitForResponse(response => 
            response.url().includes('/api/auth/login') && response.status() === 401
        );
        
        await loginPage.login('wrong@example.com', 'wrongpass');
        await responsePromise;
        
        // Give Ant Design a moment to render the message portal
        await page.waitForTimeout(2000);
        
        // Assert error message exists in the body
        await expect(page.locator('body')).toContainText(/failed|credentials|invalid/i, { timeout: 15000 });
    });

    test('should show validation errors for empty fields', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        
        // Clear initial values
        await page.getByPlaceholder('Email').clear();
        await page.getByPlaceholder('Password').clear();
        
        await page.getByRole('button', { name: 'Log in' }).click();
        
        // Assert validation messages (Ant Design Form)
        await expect(page.getByText('Please input your Email!')).toBeVisible();
        await expect(page.getByText('Please input your Password!')).toBeVisible();
    });
});
