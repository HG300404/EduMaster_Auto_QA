import { Page, Locator, expect } from '@playwright/test';

export interface StudentFormData {
    name: string;
    email: string;
    code: string;
    phone?: string;
    level?: string;
}

export class StudentPage {
    readonly page: Page;
    readonly addStudentBtn: Locator;
    readonly studentTable: Locator;

    readonly searchNameInput: Locator;
    readonly searchCodeInput: Locator;

    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly codeInput: Locator;
    readonly phoneInput: Locator;
    readonly levelSelect: Locator;
    readonly submitBtn: Locator;
    readonly cancelBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addStudentBtn = page.getByRole('button', { name: 'Add Student' });
        this.studentTable = page.locator('.ant-table');

        this.searchNameInput = page.getByPlaceholder('Search Name');
        this.searchCodeInput = page.getByPlaceholder('Search Code');

        this.nameInput = page.getByLabel('Full Name');
        this.emailInput = page.getByLabel('Email');
        this.codeInput = page.getByLabel('Student Code');
        this.phoneInput = page.getByLabel('Phone');
        this.levelSelect = page.getByLabel('Level');
        this.submitBtn = page.getByRole('button', { name: 'Submit' });
        this.cancelBtn = page.getByRole('button', { name: 'Cancel' });
    }

    async navigateToStudents() {
        await this.page.goto('/admin/students');
        await expect(this.addStudentBtn).toBeVisible();
    }

    async searchStudent(name: string) {
        const listResponse = this.page.waitForResponse(
            (res) => res.url().includes('/api/student/') && res.request().method() === 'GET'
        );
        await this.searchNameInput.fill(name);
        await listResponse;
        await this.studentTable.locator('.ant-spin-spinning').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }

    async openAddStudentForm() {
        await this.addStudentBtn.click();
        await expect(this.nameInput).toBeVisible();
    }

    async fillStudentForm(studentData: StudentFormData) {
        await this.nameInput.fill(studentData.name);
        await this.emailInput.fill(studentData.email);
        await this.codeInput.fill(studentData.code);

        if (studentData.phone) {
            await this.phoneInput.fill(studentData.phone);
        }

        if (studentData.level) {
            await this.levelSelect.click();
            await this.page.getByRole('option', { name: new RegExp(studentData.level, 'i') }).click();
        }
    }

    async submitForm() {
        const createResponse = this.page.waitForResponse(
            (res) =>
                res.url().includes('/api/student/') &&
                res.request().method() === 'POST' &&
                res.status() === 201,
            { timeout: 30000 }
        );
        await this.submitBtn.click();
        await createResponse;
        await expect(this.page.getByText(/Student created/i)).toBeVisible({ timeout: 10000 });
        await expect(this.page.locator('.ant-drawer-open')).toHaveCount(0, { timeout: 10000 });
    }

    async verifyStudentInTable(name: string) {
        const row = this.studentTable.locator('tr.ant-table-row').filter({ hasText: name });
        await expect(row.first()).toBeVisible({ timeout: 10000 });
    }
}
