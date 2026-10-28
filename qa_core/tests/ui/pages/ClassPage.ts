// @project: EDUMASTER
// @module: LMS
// @type: UI-E2E

import { Page, Locator, expect } from '@playwright/test';

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

    async createClass(classData: { name: string, course: string; teacher?: string }): Promise<string> {
        const classCreated = this.page.waitForResponse(
            (res) =>
                res.url().includes('/api/class') &&
                res.request().method() === 'POST' &&
                res.ok(),
            { timeout: 20000 }
        );

        await this.addClassBtn.click();
        await this.nameInput.fill(classData.name);

        await this.courseSelect.click();
        const courseDropdown = this.page
            .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
            .last();
        await courseDropdown
            .locator('.ant-select-item-option-content')
            .filter({ hasText: classData.course })
            .first()
            .evaluate((el) => (el as HTMLElement).click());

        if (classData.teacher) {
            await this.teacherSelect.click();
            const teacherDropdown = this.page
                .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
                .last();
            await teacherDropdown
                .locator('.ant-select-item-option-content')
                .filter({ hasText: classData.teacher })
                .first()
                .evaluate((el) => (el as HTMLElement).click());
        }

        await this.submitBtn.click();
        const createResponse = await classCreated;
        const created = await createResponse.json();
        await expect(this.page.getByText(/Class created/i)).toBeVisible({ timeout: 10000 });

        return created.id as string;
    }

    async findClassRow(className: string) {
        const rowSelector = () =>
            this.classTable.locator('tr.ant-table-row').filter({ hasText: className }).first();

        const scanPages = async () => {
            let row = rowSelector();
            if ((await row.count()) > 0) {
                return row;
            }

            const pageLinks = this.page.locator('.ant-pagination-item a');
            const pageCount = await pageLinks.count();
            const order =
                pageCount > 1
                    ? [...Array(pageCount).keys()].reverse()
                    : [...Array(pageCount).keys()];

            for (const index of order) {
                await pageLinks.nth(index).click();
                await this.page.locator('.ant-spin-spinning').waitFor({ state: 'detached' }).catch(() => {});
                row = rowSelector();
                if ((await row.count()) > 0) {
                    return row;
                }
            }
            return rowSelector();
        };

        let row = await scanPages();
        if ((await row.count()) > 0) {
            return row;
        }

        await this.page.reload();
        await this.page.waitForLoadState('networkidle');
        row = await scanPages();
        await expect(row).toBeVisible({ timeout: 15000 });
        return row;
    }

    async goToClassDetail(className: string) {
        const row = await this.findClassRow(className);
        await row.waitFor({ state: 'visible', timeout: 15000 });
        await row.scrollIntoViewIfNeeded();
        await row.locator('button:has(.anticon-eye)').nth(0).click();
        
        await this.page.waitForURL(/\/admin\/classes\/\w+/);
    }

    /**
     * Enroll a student via the "Add Student" modal.
     * SUT loads only the first 100 students (ClassDetail.loadAllStudents). When studentName is
     * omitted, picks the first dropdown option. When provided, filters client-side by name/code.
     */
    async enrollStudent(studentName?: string): Promise<string> {
        await this.studentTab.click();

        // ClassDetail.loadAllStudents() is fired on click without await — wait for the list API first
        const studentsLoaded = this.page.waitForResponse(
            (res) =>
                res.url().includes('/api/student') &&
                res.request().method() === 'GET' &&
                res.ok(),
            { timeout: 20000 }
        );

        await this.addStudentBtn.click();
        const listResponse = await studentsLoaded;
        const listBody = await listResponse.json();
        const items = (listBody.items ?? []) as { full_name: string }[];
        expect(items.length).toBeGreaterThan(0);

        const modal = this.page.getByRole('dialog', { name: /Add Student to Class/i });
        await expect(modal).toBeVisible();

        const combobox = modal.getByRole('combobox');
        await combobox.click();

        // Use the latest open dropdown (modal select). .nth(0) can match a hidden stale panel from other selects.
        const dropdown = this.page
            .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
            .last();
        await expect(dropdown).toBeVisible({ timeout: 15000 });

        const options = dropdown.locator('.ant-select-item-option-content');
        await expect(options.first()).toBeVisible({ timeout: 15000 });

        let target = options.first();
        if (studentName) {
            await combobox.fill(studentName);
            const namePattern = new RegExp(escapeRegExp(studentName), 'i');
            const filtered = options.filter({ hasText: namePattern });
            if ((await filtered.count()) === 0) {
                throw new Error(
                    `Student "${studentName}" is not in the Add Student dropdown. ` +
                        'SUT only loads the first 100 students; provision via API or omit studentName.'
                );
            }
            target = filtered.first();
        }

        const optionLabel = (await target.innerText()).trim();
        await target.evaluate((el) => (el as HTMLElement).click());

        await modal.getByRole('button', { name: 'OK' }).click();
        await expect(modal).toBeHidden({ timeout: 10000 });

        return optionLabel.replace(/\s*\([^)]*\)\s*$/, '').trim();
    }

    async markAttendance(studentName: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') {
        await this.attendanceTab.click();

        const attendancePanel = this.page.locator('.ant-tabs-tabpane-active');
        await expect(attendancePanel).toBeVisible();

        const row = attendancePanel
            .locator('tr.ant-table-row')
            .filter({ hasText: studentName })
            .first();
        await expect(row).toBeVisible({ timeout: 15000 });
        
        const saveBtn = attendancePanel.getByRole('button', { name: 'Save Changes' });
        const takeAttendanceBtn = attendancePanel.getByRole('button', { name: 'Take Attendance' });

        if (!(await saveBtn.isVisible())) {
            await takeAttendanceBtn.click();
            await expect(saveBtn).toBeVisible({ timeout: 10000 });
        }
        
        await row.scrollIntoViewIfNeeded();
        
        const radioBtn = row
            .locator('.ant-radio-button-wrapper')
            .filter({ hasText: new RegExp(`^${status}$`, 'i') })
            .first();
        await radioBtn.click();

        await attendancePanel.getByRole('button', { name: 'Save Changes' }).click();
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
            await courseOption.evaluate(el => (el as HTMLElement).click());
        }

        await this.submitBtn.click();
        
        // Wait for success message
        await expect(this.page.locator('.ant-message-success').nth(0)).toBeVisible();
        await this.page.locator('.ant-message-success').nth(0).waitFor({ state: 'hidden' });
    }

    async deleteClass(className: string) {
        const row = await this.findClassRow(className);
        await row.scrollIntoViewIfNeeded();

        const deleteDone = this.page.waitForResponse(
            (res) => res.url().includes('/api/class/') && res.request().method() === 'DELETE',
            { timeout: 20000 }
        );

        await row.locator('button:has(.anticon-delete)').first().click();

        const popconfirm = this.page.locator('.ant-popconfirm, .ant-popover').filter({ hasText: /Sure to delete/i });
        await expect(popconfirm).toBeVisible({ timeout: 5000 });
        await popconfirm.getByRole('button', { name: /^OK$/i }).click();

        const response = await deleteDone;
        expect(response.ok()).toBeTruthy();
        await expect(this.page.locator('tr.ant-table-row').filter({ hasText: className })).toHaveCount(0, {
            timeout: 10000,
        });
    }

    /** Delete using the admin JWT from localStorage (clears enrollments first). */
    async deleteClassById(classId: string) {
        const token = await this.page.evaluate(() => localStorage.getItem('access_token'));
        expect(token).toBeTruthy();
        const headers = { Authorization: `Bearer ${token}` };

        const today = new Date().toISOString().slice(0, 10);
        await this.page.request.post(`/api/class/${classId}/attendance`, {
            headers,
            data: { date: today, records: [] },
        });

        const listRes = await this.page.request.get(`/api/class/${classId}/students?per_page=100`, {
            headers,
        });
        if (listRes.ok()) {
            const body = await listRes.json();
            const students = (body.items ?? []) as { id: string }[];
            for (const student of students) {
                await this.page.request.delete(`/api/class/${classId}/students/${student.id}`, {
                    headers,
                });
            }
        }

        const response = await this.page.request.delete(`/api/class/${classId}`, { headers });
        if (!response.ok()) {
            throw new Error(`Delete class failed: ${response.status()} ${await response.text()}`);
        }
    }
}
