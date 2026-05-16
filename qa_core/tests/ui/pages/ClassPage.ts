import { Page, Locator, expect } from '@playwright/test';

export class ClassPage {
    readonly page: Page;
    readonly addClassBtn: Locator;
    readonly classTable: Locator;

    // Form fields (Drawer/Modal)
    readonly nameInput: Locator;
    readonly courseSelect: Locator;
    readonly teacherSelect: Locator;
    readonly submitBtn: Locator;

    // Detail View
    readonly studentTab: Locator;
    readonly attendanceTab: Locator;
    readonly addStudentBtn: Locator;
    readonly takeAttendanceBtn: Locator;
    readonly saveAttendanceBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addClassBtn = page.locator('button').filter({ hasText: /^Add Class$/ }).nth(0);
        this.classTable = page.locator('.ant-table').nth(0);
 
        // Form
        this.nameInput = page.getByPlaceholder(/e\.g\./).nth(0);
        this.courseSelect = page.locator('.ant-form-item').filter({ has: page.locator('label', { hasText: 'Course' }) }).locator('.ant-select').nth(0);
        this.teacherSelect = page.locator('.ant-form-item').filter({ has: page.locator('label', { hasText: 'Primary Teacher' }) }).locator('.ant-select').nth(0);
        this.submitBtn = page.locator('button').filter({ hasText: /^Submit$/ }).nth(0);
 
        // Tabs
        this.studentTab = page.locator('.ant-tabs-tab').filter({ hasText: /Students/i }).nth(0);
        this.attendanceTab = page.locator('.ant-tabs-tab').filter({ hasText: /Attendance/i }).nth(0);
        
        // Actions inside Detail
        this.addStudentBtn = page.locator('button').filter({ hasText: /Add Student/i }).nth(0);
        this.takeAttendanceBtn = page.locator('button').filter({ hasText: /Take Attendance/i }).nth(0);
        this.saveAttendanceBtn = page.locator('button').filter({ hasText: /Save Changes/i }).nth(0);
    }

    async navigateToClasses() {
        await this.page.goto('/admin/classes');
        await this.page.waitForLoadState('networkidle');
    }

    async createClass(classData: { name: string, course: string, teacher?: string }) {
        await this.addClassBtn.click();
        await this.nameInput.fill(classData.name);
        
        // Select Course
        await this.courseSelect.click();
        const courseOption = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
            .nth(0)
            .locator('.ant-select-item-option-content')
            .filter({ hasText: classData.course })
            .nth(0);
        await courseOption.evaluate(el => (el as HTMLElement).click());

        if (classData.teacher) {
            await this.teacherSelect.click();
            const teacherOption = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
                .nth(0)
                .locator('.ant-select-item-option-content')
                .filter({ hasText: classData.teacher })
                .nth(0);
            await teacherOption.evaluate(el => (el as HTMLElement).click());
        }

        await this.submitBtn.click();
        await expect(this.page.locator('.ant-message-success').nth(0)).toBeVisible();
        await this.page.locator('.ant-message-success').nth(0).waitFor({ state: 'hidden' });
    }

    async findClassRow(className: string) {
        let row = this.page.locator('tr.ant-table-row').filter({ hasText: className }).nth(0);
        
        if (await row.count() === 0) {
            const paginationItems = this.page.locator('.ant-pagination-item');
            if (await paginationItems.count() > 1) {
                await paginationItems.last().click();
                await this.page.waitForSelector('.ant-spin-spinning', { state: 'detached' });
                await this.page.waitForTimeout(1000);
                row = this.page.locator('tr.ant-table-row').filter({ hasText: className }).nth(0);
            }
        }

        if (await row.count() === 0) {
            await this.page.reload();
            await this.page.waitForLoadState('networkidle');
            row = this.page.locator('tr.ant-table-row').filter({ hasText: className }).nth(0);
        }
        
        return row;
    }

    async goToClassDetail(className: string) {
        const row = await this.findClassRow(className);
        await row.waitFor({ state: 'visible', timeout: 15000 });
        await row.scrollIntoViewIfNeeded();
        await row.locator('button:has(.anticon-eye)').nth(0).click();
        
        await this.page.waitForURL(/\/admin\/classes\/\w+/);
    }

    async enrollStudent(studentName?: string): Promise<string> {
        await this.studentTab.click();
        await this.addStudentBtn.click();
        
        const modal = this.page.locator('.ant-modal-content').nth(0);
        await modal.waitFor({ state: 'visible' });
        
        // Open the select
        const select = modal.locator('.ant-select').nth(0);
        await select.click();
        
        // Wait for the dropdown to be visible
        const dropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').nth(0);
        await dropdown.waitFor({ state: 'visible' });

        if (studentName) {
            const selectInput = select.locator('input').nth(0);
            await selectInput.fill(studentName);
            await this.page.waitForTimeout(500);
        }
        
        // Find the first available option
        const firstOption = dropdown.locator('.ant-select-item-option-content').nth(0);
        await expect(firstOption).toBeVisible({ timeout: 10000 });
        
        const actualName = (await firstOption.innerText()).trim();
        await firstOption.click();
        
        await modal.getByRole('button', { name: 'OK' }).nth(0).click();
        await modal.waitFor({ state: 'hidden' });
        
        return actualName;
    }

    async markAttendance(studentName: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') {
        await this.attendanceTab.click();
        
        // Robust wait for the specific student to appear in the table (handles lazy loading)
        const row = this.page.locator('tr.ant-table-row').filter({ hasText: studentName }).nth(0);
        await row.waitFor({ state: 'visible', timeout: 15000 });
        
        // Handle "Take Attendance" button
        try {
            // Check if we are already in edit mode (Save Changes button is visible)
            if (!(await this.saveAttendanceBtn.isVisible())) {
                await this.takeAttendanceBtn.waitFor({ state: 'visible', timeout: 5000 });
                await this.takeAttendanceBtn.click();
            }
        } catch (e) {
            // Fallback or already in edit mode
        }
        
        await row.scrollIntoViewIfNeeded();
        
        const radioBtn = row.locator('.ant-radio-button-wrapper').filter({ hasText: new RegExp(`^${status}$`, 'i') }).nth(0);
        await radioBtn.click();
        
        await this.saveAttendanceBtn.click();
        await expect(this.page.locator('.ant-message-success').nth(0)).toBeVisible();
    }

    async editClass(className: string, newName: string, course?: string) {
        const row = await this.findClassRow(className);
        await row.scrollIntoViewIfNeeded();
        await row.locator('button:has(.anticon-edit)').nth(0).click();
        
        await this.nameInput.waitFor({ state: 'visible' });
        await this.nameInput.fill(newName);
        
        if (course) {
            await this.courseSelect.click();
            const courseOption = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
                .nth(0)
                .locator('.ant-select-item-option-content')
                .filter({ hasText: course })
                .nth(0);
            await courseOption.click();
        }

        await this.submitBtn.click();
        
        // Wait for success message
        await expect(this.page.locator('.ant-message-success').nth(0)).toBeVisible();
        await this.page.locator('.ant-message-success').nth(0).waitFor({ state: 'hidden' });
    }

    async deleteClass(className: string) {
        const row = await this.findClassRow(className);
        await row.scrollIntoViewIfNeeded();
        await row.locator('button:has(.anticon-delete)').nth(0).click();
        
        const popconfirmBtn = this.page.locator('.ant-popover:not(.ant-popover-hidden) button.ant-btn-primary').nth(0);
        await popconfirmBtn.waitFor({ state: 'visible' });
        await popconfirmBtn.click();
        
        await expect(this.page.locator('.ant-message-success').nth(0)).toBeVisible();
        await this.page.locator('.ant-message-success').nth(0).waitFor({ state: 'hidden' });
    }
}
