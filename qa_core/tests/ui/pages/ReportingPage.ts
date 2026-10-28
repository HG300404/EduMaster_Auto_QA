// @project: EDUMASTER
// @module: Reporting
// @type: UI-E2E

import { Page, expect } from '@playwright/test';

export class ReportingPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goToOverview() {
        await this.page.goto('/admin/reports/overview');
        await expect(this.page.getByText('Center Management Overview')).toBeVisible({ timeout: 30000 });
    }

    async verifyOverviewStatsVisible() {
        await expect(this.page.getByText('Total Students')).toBeVisible();
        await expect(this.page.getByText('Total Revenue')).toBeVisible();
        await expect(this.page.getByText('Lead Conversion')).toBeVisible();
        await expect(this.page.getByText('Active Classes')).toBeVisible();
    }

    async verifyRevenueTrendSection() {
        await expect(this.page.getByText('Revenue Growth Trend (Last 6 Months)')).toBeVisible();
        await expect(this.page.getByText('Student Acquisition Sources')).toBeVisible();
    }

    async goToRevenueReport() {
        await this.page.goto('/admin/reports/revenue');
        await expect(this.page.getByRole('heading', { name: 'Financial Revenue Report' })).toBeVisible({
            timeout: 30000,
        });
    }

    async verifyRevenueReportMetrics() {
        await expect(this.page.getByText('Total Invoiced')).toBeVisible();
        await expect(this.page.getByText('Total Collected')).toBeVisible();
        await expect(this.page.getByText('Outstanding Debt')).toBeVisible();
    }
}
