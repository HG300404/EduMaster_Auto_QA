// @project: EDUMASTER
// @module: Attendance
// @type: UI-E2E
import { Page, Locator, expect } from '@playwright/test';

export class AttendancePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** Attendance tab content — avoids matching the hidden Students table on ClassDetail. */
    private get panel(): Locator {
        return this.page.locator('.ant-tabs-tabpane-active');
    }

    private get datePicker(): Locator {
        return this.panel.locator('.ant-picker').first();
    }

    private get createSessionBtn(): Locator {
        return this.panel.locator('button').filter({ has: this.page.locator('.anticon-plus') }).first();
    }

    private get showQRBtn(): Locator {
        return this.panel.locator('button').filter({ hasText: /^QR$/ }).first();
    }

    private get takeAttendanceBtn(): Locator {
        return this.panel.getByRole('button', { name: 'Take Attendance' });
    }

    private get saveChangesBtn(): Locator {
        return this.panel.getByRole('button', { name: 'Save Changes' });
    }

    private get attendanceTable(): Locator {
        return this.panel.locator('.ant-table').first();
    }

    private get sessionTitleInput(): Locator {
        return this.page.locator('.ant-modal-content input[placeholder="e.g. Morning Session"]').first();
    }

    private get submitSessionBtn(): Locator {
        return this.page.locator('.ant-modal-content button').filter({ hasText: /^Create Session$/ }).first();
    }

    private get qrCodeModal(): Locator {
        return this.page.locator('.ant-modal-content').filter({ hasText: /Class Attendance QR Code/i }).first();
    }

    private get createSessionModal(): Locator {
        return this.page.locator('.ant-modal-content').filter({ hasText: /Create Attendance Session/i }).first();
    }

    async goToAttendance(classId: string) {
        await this.page.goto(`/admin/classes/${classId}`);
        await expect(this.page).toHaveURL(new RegExp(`/admin/classes/${classId}`), { timeout: 20000 });

        const attendanceTab = this.page.getByRole('tab', { name: /Attendance/i });
        await expect(attendanceTab).toBeVisible({ timeout: 30000 });
        await attendanceTab.click();
        await expect(this.panel).toBeVisible();
    }

    async openCreateSessionModal() {
        await this.createSessionBtn.click();
        await this.createSessionModal.waitFor({ state: 'visible' });
    }

    async fillSessionTitle(title: string) {
        await this.sessionTitleInput.fill(title);
    }

    async submitSessionForm() {
        await this.submitSessionBtn.click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible();
        await this.createSessionModal.waitFor({ state: 'hidden' });
        await expect(this.attendanceTable.locator('tr.ant-table-row').first()).toBeVisible({ timeout: 15000 });
    }

    async createSession(title: string) {
        await this.openCreateSessionModal();
        if (title) {
            await this.fillSessionTitle(title);
        }
        await this.submitSessionForm();
    }

    async markAttendance(studentName: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') {
        const row = this.attendanceTable.locator('tr.ant-table-row').filter({ hasText: studentName }).first();
        await expect(row).toBeVisible({ timeout: 15000 });

        if (!(await this.saveChangesBtn.isVisible())) {
            await this.takeAttendanceBtn.click();
            await expect(this.saveChangesBtn).toBeVisible({ timeout: 10000 });
        }

        const radioBtn = row
            .locator('.ant-radio-button-wrapper')
            .filter({ hasText: new RegExp(`^${status}$`, 'i') })
            .first();
        await radioBtn.click();
    }

    async saveAttendance() {
        await this.saveChangesBtn.click();
        await expect(this.page.locator('.ant-message-success').first()).toBeVisible();
    }

    async verifyAttendanceStatus(studentName: string, status: string) {
        const row = this.attendanceTable.locator('tr.ant-table-row').filter({ hasText: studentName }).first();
        await expect(row).toBeVisible();
        const statusTag = row.locator('.ant-tag').filter({ hasText: new RegExp(`^${status}$`, 'i') }).first();
        await expect(statusTag).toBeVisible();
    }

    async openQRModal() {
        await this.showQRBtn.click();
        await this.qrCodeModal.waitFor({ state: 'visible' });
        await expect(this.qrCodeModal.locator('canvas, svg').first()).toBeVisible({ timeout: 5000 });
    }

    async closeQRModal() {
        await this.qrCodeModal
            .locator('.ant-modal-footer')
            .getByRole('button', { name: /^Close$/ })
            .click();
        await this.qrCodeModal.waitFor({ state: 'hidden' });
    }

    async goToReportsTab() {
        const reportsTab = this.page.getByRole('tab', { name: /Reports/i });
        await expect(reportsTab).toBeVisible({ timeout: 15000 });
        await reportsTab.click();
        await expect(this.page.locator('.ant-tabs-tabpane-active')).toBeVisible();
    }

    async verifyAttendanceReportVisible() {
        await expect(this.page.getByText('Attendance Summary')).toBeVisible({ timeout: 15000 });
        await expect(this.page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
    }
}
