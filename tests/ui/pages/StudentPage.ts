import { Page, Locator, expect } from '@playwright/test';

export class StudentPage {
    readonly page: Page;
    readonly addStudentBtn: Locator;
    readonly studentTable: Locator;
    
    // Form fields
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly codeInput: Locator;
    readonly submitBtn: Locator;
    readonly cancelBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addStudentBtn = page.getByTestId('add-student-btn');
        this.studentTable = page.getByTestId('student-table');
        
        // Form locators
        this.nameInput = page.getByTestId('student-name');
        this.emailInput = page.getByTestId('student-email');
        this.codeInput = page.getByTestId('student-code');
        this.submitBtn = page.getByTestId('student-submit-btn');
        this.cancelBtn = page.getByTestId('student-cancel-btn');
    }

    async navigateToStudents() {
        // Assuming there is a sidebar link or direct URL
        await this.page.goto('/admin/students');
        await expect(this.addStudentBtn).toBeVisible();
    }

    async openAddStudentForm() {
        await this.addStudentBtn.click();
        await expect(this.nameInput).toBeVisible();
    }

    async fillStudentForm(studentData: { name: string, email: string, code: string }) {
        await this.nameInput.fill(studentData.name);
        await this.emailInput.fill(studentData.email);
        await this.codeInput.fill(studentData.code);
    }

    async submitForm() {
        await this.submitBtn.click();
    }

    async verifyStudentInTable(name: string) {
        const row = this.studentTable.locator(`text=${name}`);
        await expect(row).toBeVisible();
    }
}
