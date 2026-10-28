// @project: EDUMASTER
// @module: CRM
// @type: UI-E2E

import { Page, Locator, expect } from '@playwright/test';

export class CrmLeadPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    private get createLeadModal(): Locator {
        return this.page.locator('.ant-modal-content').filter({ hasText: /Create New Lead/i }).first();
    }

    private get editLeadModal(): Locator {
        return this.page.locator('.ant-modal-content').filter({ hasText: /Edit Lead/i }).first();
    }

    async goToLeadList() {
        await this.page.goto('/admin/crm/leads');
        await expect(this.page.getByText('Lead Management')).toBeVisible({ timeout: 30000 });
    }

    async openCreateLeadModal() {
        await this.page.getByRole('button', { name: /Add Lead/i }).click();
        await this.createLeadModal.waitFor({ state: 'visible' });
    }

    async fillLeadName(name: string) {
        await this.createLeadModal.locator('.ant-form-item').filter({ hasText: 'Name' }).locator('input').fill(name);
    }

    async fillLeadEmail(email: string) {
        await this.createLeadModal.locator('.ant-form-item').filter({ hasText: 'Email' }).locator('input').fill(email);
    }

    async fillLeadPhone(phone: string) {
        await this.createLeadModal.locator('.ant-form-item').filter({ hasText: 'Phone' }).locator('input').fill(phone);
    }

    async selectLeadSource(source: string) {
        const sourceField = this.createLeadModal.locator('.ant-form-item').filter({ hasText: 'Source' });
        await sourceField.locator('.ant-select').click();
        await this.page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
            .filter({ hasText: source })
            .first()
            .click();
    }

    async selectAssignee(staffName: string) {
        const assignField = this.createLeadModal.locator('.ant-form-item').filter({ hasText: 'Assign To' });
        await assignField.locator('.ant-select').click();
        await this.page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
            .filter({ hasText: staffName })
            .first()
            .click();
    }

    async submitCreateLeadForm() {
        await this.createLeadModal.getByRole('button', { name: /Create Lead/i }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible();
        await this.createLeadModal.waitFor({ state: 'hidden' });
    }

    async verifyLeadInTable(leadName: string) {
        await expect(this.page.locator('.ant-table-row').filter({ hasText: leadName }).first()).toBeVisible({
            timeout: 20000,
        });
    }

    async openLeadDetail(leadName: string) {
        const row = this.page.locator('.ant-table-row').filter({ hasText: leadName }).first();
        await expect(row).toBeVisible({ timeout: 20000 });
        await row.getByRole('link', { name: leadName }).click();
        await expect(this.page.getByText('Lead Information')).toBeVisible({ timeout: 20000 });
    }

    async goToLeadDetailById(leadId: string, leadName: string) {
        await this.page.goto(`/admin/crm/leads/${leadId}`);
        await expect(this.page.locator('.ant-descriptions').getByText(leadName)).toBeVisible({ timeout: 30000 });
    }

    async openEditModal() {
        const card = this.page.locator('.ant-card').filter({ hasText: 'Lead Information' });
        await card.getByRole('button', { name: 'Edit' }).click();
        await this.editLeadModal.waitFor({ state: 'visible' });
    }

    async selectLeadStatus(status: string) {
        const statusField = this.editLeadModal.locator('.ant-form-item').filter({ hasText: 'Status' });
        await statusField.locator('.ant-select').click();
        await this.page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
            .filter({ hasText: status })
            .first()
            .click();
    }

    async submitUpdateLeadForm() {
        await this.editLeadModal.getByRole('button', { name: /Update Lead/i }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible();
        await this.editLeadModal.waitFor({ state: 'hidden' });
    }

    async verifyStatusOnDetail(status: string) {
        await expect(this.page.locator('.ant-descriptions').getByText(status, { exact: true })).toBeVisible();
    }

    async verifyAssigneeOnDetail(staffName: string) {
        await expect(this.page.locator('.ant-descriptions').getByText(staffName)).toBeVisible();
    }
}
