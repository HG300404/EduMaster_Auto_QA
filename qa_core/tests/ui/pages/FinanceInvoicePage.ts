// @project: EDUMASTER
// @module: Finance
// @type: UI-E2E

import { Page, Locator, expect } from '@playwright/test';

export class FinanceInvoicePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    private get invoiceFormCard(): Locator {
        return this.page.locator('.ant-card').filter({ hasText: /New Invoice/i }).first();
    }

    private get paymentModal(): Locator {
        return this.page.locator('.ant-modal-content').filter({ hasText: /Record Payment/i }).first();
    }

    async goToCreateInvoice() {
        await this.page.goto('/admin/finance/invoices/new');
        await expect(this.invoiceFormCard).toBeVisible({ timeout: 30000 });
        await this.page.waitForLoadState('networkidle');
    }

    async goToInvoiceDetail(invoiceId: string) {
        await this.page.goto(`/admin/finance/invoices/${invoiceId}`);
        await expect(this.page.locator('.ant-card').filter({ hasText: /Invoice #/i }).first()).toBeVisible({
            timeout: 30000,
        });
    }

    async selectStudent(studentCode: string) {
        const studentField = this.invoiceFormCard.locator('.ant-form-item').filter({ hasText: 'Student' });
        await studentField.locator('.ant-select').click();
        await studentField.locator('input').fill(studentCode);
        await this.page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
            .filter({ hasText: studentCode })
            .first()
            .click();
    }

    async pickDateByLabel(label: string) {
        const field = this.invoiceFormCard.locator('.ant-form-item').filter({ hasText: label });
        await field.locator('.ant-picker').click();
        await this.page.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden) .ant-picker-cell-today').click();
    }

    async fillLineItem(description: string, unitPrice: number) {
        await this.invoiceFormCard.getByPlaceholder('Description').fill(description);
        await this.invoiceFormCard.getByPlaceholder('Unit Price').fill(String(unitPrice));
    }

    async submitCreateInvoice() {
        await this.invoiceFormCard.getByRole('button', { name: /Create Invoice/i }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible({ timeout: 20000 });
    }

    async verifyInvoiceStatus(status: string) {
        await expect(this.page.locator('.ant-descriptions').getByText(status, { exact: true })).toBeVisible();
    }

    async openRecordPaymentModal() {
        await this.page.getByRole('button', { name: /Record Payment/i }).click();
        await this.paymentModal.waitFor({ state: 'visible' });
    }

    async fillPaymentMethod(method: string) {
        const methodField = this.paymentModal.locator('.ant-form-item').filter({ hasText: 'Method' });
        await methodField.locator('.ant-select').click();
        await this.page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
            .filter({ hasText: method })
            .first()
            .click();
    }

    async submitPayment() {
        await this.paymentModal.getByRole('button', { name: /Submit Payment/i }).click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible();
        await this.paymentModal.waitFor({ state: 'hidden' });
    }

    async downloadInvoicePdf() {
        const downloadPromise = this.page.waitForEvent('download');
        await this.page.getByRole('button', { name: /Download PDF/i }).click();
        return downloadPromise;
    }
}
