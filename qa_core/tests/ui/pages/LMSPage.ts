// @project: EDUMASTER
// @module: LMS
// @type: UI-E2E
import { Page, Locator, expect } from '@playwright/test';

export class LMSPage {
    readonly page: Page;

    readonly createLessonBtn: Locator;
    readonly titleInput: Locator;
    readonly contentTypeSelect: Locator;
    readonly orderInput: Locator;
    readonly contentTextArea: Locator;
    readonly contentUrlInput: Locator;
    readonly fileUploadBtn: Locator;
    readonly fileInput: Locator;
    readonly submitLessonBtn: Locator;
    readonly backBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.createLessonBtn = page.getByRole('button', { name: /Add Lesson/i });

        this.titleInput = page.locator('.ant-form-item').filter({ hasText: /Lesson Title/i }).locator('input').nth(0);
        this.contentTypeSelect = page.locator('.ant-form-item').filter({ hasText: /Content Type/i }).locator('.ant-select').nth(0);
        this.orderInput = page.locator('.ant-input-number-input').nth(0);
        this.contentTextArea = page.locator('textarea').nth(0);
        this.contentUrlInput = page.locator('.ant-form-item').filter({ hasText: /External URL/i }).locator('input').nth(0);

        this.fileUploadBtn = page.locator('button').filter({ hasText: /Select File/i }).nth(0);
        this.fileInput = page.locator('input[type="file"]').nth(0);
        this.submitLessonBtn = page.locator('button[type="submit"]').filter({ hasText: /Create Lesson/i }).nth(0);
        this.backBtn = page.locator('button').filter({ hasText: /^Back$/i }).nth(0);
    }

    async goToCourseAdmin(courseId: string) {
        await this.page.goto(`/admin/lms/courses/${courseId}`);
        await expect(this.createLessonBtn).toBeVisible({ timeout: 30000 });
    }

    async openCreateLessonForm() {
        await this.createLessonBtn.click();
        await expect(this.page.getByText('Create New Lesson')).toBeVisible({ timeout: 15000 });
        await expect(this.titleInput).toBeVisible();
    }

    async fillLessonTitle(title: string) {
        await this.titleInput.fill(title);
    }

    async selectContentType(type: 'text' | 'pdf' | 'ppt' | 'scorm' | 'video' | 'audio') {
        await this.contentTypeSelect.click();
        const label =
            type === 'text'
                ? /^Text \/ Article$/
                : type === 'pdf'
                  ? /PDF Document/i
                  : new RegExp(type, 'i');
        await this.page.locator('.ant-select-item-option-content').filter({ hasText: label }).first().click();
    }

    async fillLessonContentText(text: string) {
        await this.contentTextArea.fill(text);
    }

    async fillExternalUrl(url: string) {
        await this.contentUrlInput.fill(url);
    }

    async fillVideoLessonForm(title: string, videoUrl: string) {
        await this.fillLessonTitle(title);
        await this.selectContentType('video');
        await this.fillExternalUrl(videoUrl);
    }

    async uploadLessonFile(filePath: string) {
        await this.fileUploadBtn.waitFor({ state: 'visible' });
        await this.fileInput.setInputFiles(filePath);
    }

    async submitLessonForm() {
        const createResponse = this.page.waitForResponse(
            (res) => res.url().includes('/lessons') && res.request().method() === 'POST',
            { timeout: 20000 }
        );
        await this.submitLessonBtn.click();
        const response = await createResponse;
        expect(response.ok(), `Lesson create API returned HTTP ${response.status()}`).toBeTruthy();
        await expect(this.page.getByText(/Lesson created successfully/i)).toBeVisible({ timeout: 10000 });
    }

    async verifyLessonInCourseList(title: string) {
        await expect(this.page.getByText(title, { exact: true })).toBeVisible({ timeout: 15000 });
    }
}
