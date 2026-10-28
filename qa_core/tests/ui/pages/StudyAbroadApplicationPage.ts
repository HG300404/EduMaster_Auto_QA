// @project: EDUMASTER
// @module: StudyAbroad
// @type: UI-E2E

import { Page, Locator, expect } from '@playwright/test';

export class StudyAbroadApplicationPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    private get newApplicationModal(): Locator {
        return this.page.locator('.ant-modal-content').filter({ hasText: /New Application/i }).first();
    }

    async goToApplicationsBoard() {
        await this.page.goto('/admin/study-abroad/applications');
        await expect(this.page.locator('.ant-card-head-title').filter({ hasText: 'Applications' })).toBeVisible({
            timeout: 30000,
        });
    }

    async openNewApplicationModal() {
        await this.page.getByRole('button', { name: /New Application/i }).click();
        await this.newApplicationModal.waitFor({ state: 'visible' });
    }

    async selectCandidateInModal(candidateName: string) {
        const field = this.newApplicationModal.locator('.ant-form-item').filter({ hasText: 'Candidate' });
        await field.locator('.ant-select').click();
        await this.page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
            .filter({ hasText: candidateName })
            .first()
            .click();
    }

    async selectJobOrderInModal(jobTitle: string) {
        const field = this.newApplicationModal.locator('.ant-form-item').filter({ hasText: 'Job Order' });
        await field.locator('.ant-select').click();
        await this.page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
            .filter({ hasText: jobTitle })
            .first()
            .click();
    }

    async submitNewApplicationForm() {
        await this.newApplicationModal.getByRole('button', { name: /Create Application/i }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible({ timeout: 15000 });
        await this.newApplicationModal.waitFor({ state: 'hidden' });
    }

    async verifyApplicationInTable(candidateName: string, jobTitle: string) {
        const row = this.page.locator('.ant-table-row').filter({ hasText: candidateName }).filter({ hasText: jobTitle }).first();
        await expect(row).toBeVisible({ timeout: 20000 });
    }

    async openApplicationDetailFromTable(candidateName: string) {
        await this.page.locator('.ant-table-row').filter({ hasText: candidateName }).first().click();
        await expect(this.page).toHaveURL(/\/admin\/study-abroad\/applications\/.+/, { timeout: 30000 });
        await expect(this.page.getByRole('heading', { name: new RegExp(`Application: ${candidateName}`) })).toBeVisible({
            timeout: 30000,
        });
    }

    private get checklistCard(): Locator {
        return this.page.locator('.ant-card').filter({ hasText: /^Checklist:/ }).first();
    }

    async verifyChecklistStage(stageName: string) {
        await expect(this.checklistCard).toContainText(`Checklist: ${stageName}`);
    }

    async completeAllChecklistItems() {
        const checkboxes = this.checklistCard.locator('.ant-checkbox-wrapper:not(.ant-checkbox-wrapper-disabled)');
        const count = await checkboxes.count();
        for (let i = 0; i < count; i++) {
            const checkbox = checkboxes.nth(i);
            const input = checkbox.locator('input[type="checkbox"]');
            if (!(await input.isChecked())) {
                await checkbox.click();
            }
        }
        await expect(this.checklistCard.getByRole('button', { name: 'Next Stage' })).toBeEnabled({ timeout: 15000 });
    }

    async advanceToNextStage() {
        await this.checklistCard.getByRole('button', { name: 'Next Stage' }).click();
        await expect(this.checklistCard).toContainText('Checklist: School Selection', { timeout: 30000 });
    }

    async verifyWorkflowStepActive(stepName: string) {
        await expect(this.page.locator('.ant-steps-item-process').filter({ hasText: stepName })).toBeVisible({
            timeout: 20000,
        });
    }
}
