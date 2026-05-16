import { Page, Locator, expect } from '@playwright/test';

export class StudentPage {
    readonly page: Page;
    readonly addStudentBtn: Locator;
    readonly studentTable: Locator;
    
    // Search inputs
    readonly searchNameInput: Locator;
    readonly searchCodeInput: Locator;

    // Form fields (Drawer)
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly codeInput: Locator;
    readonly levelSelect: Locator;
    readonly submitBtn: Locator;
    readonly cancelBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addStudentBtn = page.getByRole('button', { name: 'Add Student' });
        this.studentTable = page.locator('.ant-table');
        
        // Search locators
        this.searchNameInput = page.getByPlaceholder('Search Name');
        this.searchCodeInput = page.getByPlaceholder('Search Code');

        // Form locators (Drawer)
        this.nameInput = page.getByLabel('Full Name');
        this.emailInput = page.getByLabel('Email');
        this.codeInput = page.getByLabel('Student Code');
        this.levelSelect = page.getByLabel('Level');
        this.submitBtn = page.getByRole('button', { name: 'Submit' });
        this.cancelBtn = page.getByRole('button', { name: 'Cancel' });
    }

    async navigateToStudents() {
        await this.page.goto('/admin/students');
        await expect(this.addStudentBtn).toBeVisible();
    }

    async searchStudent(name: string) {
        await this.searchNameInput.fill(name);
        // Ant Design Input onChange might have debouncing, but Playwright fill should handle it
        await this.page.waitForTimeout(500); 
    }

    async openAddStudentForm() {
        await this.addStudentBtn.click();
        await expect(this.nameInput).toBeVisible();
    }

    async fillStudentForm(studentData: { name: string, email: string, code: string, level?: string }) {
        await this.nameInput.fill(studentData.name);
        await this.emailInput.fill(studentData.email);
        await this.codeInput.fill(studentData.code);
        
        if (studentData.level) {
            await this.levelSelect.click();
            await this.page.locator(`.ant-select-item-option-content:has-text("${studentData.level}")`).click();
        }
    }

    async submitForm() {
        await this.submitBtn.click();
        await this.page.waitForSelector('.ant-message-success'); // Wait for antd success message
    }

    async verifyStudentInTable(name: string) {
        const row = this.studentTable.locator(`text=${name}`);
        await expect(row).toBeVisible();
    }
}
