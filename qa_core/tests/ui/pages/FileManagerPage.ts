// @project: EDUMASTER
// @module: File Upload
// @type: UI-E2E

import { Page, Locator, expect } from '@playwright/test';

export class FileManagerPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    private get uploadModal(): Locator {
        return this.page.locator('.ant-modal-content').filter({ hasText: /Upload Files/i }).first();
    }

    async goToFileManager() {
        await this.page.goto('/admin/files');
        await expect(this.page.getByRole('heading', { name: 'File Manager' })).toBeVisible({ timeout: 30000 });
    }

    async openUploadDialog() {
        await this.page.locator('.flex.gap-3 button').filter({ hasText: /^Upload$/ }).click();
        await this.uploadModal.waitFor({ state: 'visible' });
    }

    async uploadLocalFile(filePath: string) {
        await this.uploadModal.locator('input[type="file"]').setInputFiles(filePath);
        await this.uploadModal.getByRole('button', { name: /Start Upload/i }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible({ timeout: 30000 });
        await this.uploadModal.waitFor({ state: 'hidden' });
    }

    async verifyFileVisible(fileName: string) {
        await expect(this.page.getByText(fileName, { exact: true }).first()).toBeVisible({ timeout: 20000 });
    }

    async createFolder(folderName: string) {
        this.page.once('dialog', async (dialog) => {
            await dialog.accept(folderName);
        });
        await this.page.getByRole('button', { name: /New Folder/i }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible({ timeout: 15000 });
    }

    async verifyFolderVisible(folderName: string) {
        await expect(this.page.getByText(folderName, { exact: true }).first()).toBeVisible({ timeout: 20000 });
    }

    async deleteFile(fileName: string) {
        const fileCard = this.page.locator('.ant-card').filter({ hasText: fileName }).first();
        await expect(fileCard).toBeVisible({ timeout: 20000 });
        await fileCard.locator('.anticon-more').click();
        await this.page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').getByText('Delete', { exact: true }).click();
        const confirm = this.page.locator('.ant-modal-confirm');
        await confirm.waitFor({ state: 'visible' });
        await confirm.locator('.ant-btn-primary').click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible({ timeout: 15000 });
        await this.goToFileManager();
    }
}
