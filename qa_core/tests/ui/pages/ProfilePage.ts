// @project: EDUMASTER
// @module: Auth
// @type: UI-E2E

import { Page, Locator, expect } from '@playwright/test';

export class ProfilePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goToProfile() {
        await this.page.goto('/admin/profile');
        await expect(this.page.getByRole('heading', { name: 'My Profile' })).toBeVisible({ timeout: 30000 });
    }

    async openSecurityTab() {
        await this.page.getByRole('tab', { name: 'Security' }).click();
        await expect(this.page.locator('.ant-card-head-title').filter({ hasText: 'Change Password' })).toBeVisible();
    }

    async updateFullName(fullName: string) {
        const form = this.page.locator('.ant-card').filter({ hasText: 'Update Information' });
        await form.locator('.ant-form-item').filter({ hasText: 'Full Name' }).locator('input').fill(fullName);
        await form.getByRole('button', { name: 'Update Profile' }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible({ timeout: 15000 });
    }

    async verifyFullNameDisplayed(fullName: string) {
        const input = this.page.locator('.ant-form-item').filter({ hasText: 'Full Name' }).locator('input');
        await expect(input).toHaveValue(fullName, { timeout: 15000 });
    }

    async changePassword(oldPassword: string, newPassword: string) {
        const card = this.page.locator('.ant-card').filter({ hasText: 'Change Password' });
        const fields = card.locator('.ant-form-item');
        await fields.nth(0).locator('input').fill(oldPassword);
        await fields.nth(1).locator('input').fill(newPassword);
        await fields.nth(2).locator('input').fill(newPassword);
        await card.getByRole('button', { name: 'Change Password' }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible({ timeout: 15000 });
    }
}

export class ForgotPasswordPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async open() {
        await this.page.goto('/forgot-password');
        await expect(this.page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible({ timeout: 30000 });
    }

    async submitEmail(email: string) {
        await this.page.getByPlaceholder('Email').fill(email);
        await this.page.getByRole('button', { name: 'Send Reset Link' }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible({ timeout: 10000 });
    }
}
