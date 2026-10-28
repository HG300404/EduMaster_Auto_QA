// @project: EDUMASTER
// @module: Auth
// @type: UI-E2E

import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage, ForgotPasswordPage } from '../pages/ProfilePage';

const PROFILE_EMAIL = process.env.PROFILE_TEST_EMAIL || 'counselor@edumaster.com';
const PROFILE_PASSWORD = process.env.PROFILE_TEST_PASSWORD || 'password123';

test.describe('User Profile Tests', () => {
    test.describe.configure({ timeout: 120000 });

    let loginPage: LoginPage;
    let profilePage: ProfilePage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        profilePage = new ProfilePage(page);

        await loginPage.navigate();
        await loginPage.login(PROFILE_EMAIL, PROFILE_PASSWORD);
        await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    });

    test('should update profile full name', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        const updatedName = `QA Counselor ${Date.now()}`;

        await uiStep(page, testInfo, 'Open profile page', async () => {
            await profilePage.goToProfile();
        });

        await uiStep(page, testInfo, 'Update full name', async () => {
            await profilePage.updateFullName(updatedName);
        });

        await uiStep(page, testInfo, 'Verify updated name on profile', async () => {
            await page.reload();
            await profilePage.goToProfile();
            await profilePage.verifyFullNameDisplayed(updatedName);
        });

        const token = await page.evaluate(() => localStorage.getItem('access_token') || '');
        const meRes = await request.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(meRes.ok()).toBeTruthy();
        expect((await meRes.json()).full_name).toBe(updatedName);
    });

    test('should change password from profile security tab', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        const newPassword = `Pass${Date.now()}!`;

        await uiStep(page, testInfo, 'Open profile security tab', async () => {
            await profilePage.goToProfile();
            await profilePage.openSecurityTab();
        });

        await uiStep(page, testInfo, 'Submit password change form', async () => {
            await profilePage.changePassword(PROFILE_PASSWORD, newPassword);
        });

        await uiStep(page, testInfo, 'Verify login works with new password', async () => {
            await page.context().clearCookies();
            await page.evaluate(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            });
            await loginPage.navigate();
            await loginPage.login(PROFILE_EMAIL, newPassword);
            await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
        });

        await uiStep(page, testInfo, 'Restore original staff password via API', async () => {
            const loginRes = await request.post('/api/auth/login', {
                data: { email: PROFILE_EMAIL, password: newPassword },
            });
            expect(loginRes.ok()).toBeTruthy();
            const token = (await loginRes.json()).access_token as string;
            const restoreRes = await request.post('/api/auth/change-password', {
                headers: { Authorization: `Bearer ${token}` },
                data: { old_password: newPassword, new_password: PROFILE_PASSWORD },
            });
            expect(restoreRes.ok()).toBeTruthy();
        });
    });
});

test.describe('Forgot Password UI (mock)', () => {
    test('should show mock success on forgot password page', { tag: '@smoke' }, async ({ page }, testInfo) => {
        const forgotPage = new ForgotPasswordPage(page);

        await uiStep(page, testInfo, 'Open forgot password page', async () => {
            await forgotPage.open();
        });

        await uiStep(page, testInfo, 'Submit email for password reset (UI mock)', async () => {
            await forgotPage.submitEmail(PROFILE_EMAIL);
        });

        await uiStep(page, testInfo, 'Verify mock confirmation message', async () => {
            await expect(page.locator('.ant-message-success')).toContainText(/reset link/i);
        });
    });
});
