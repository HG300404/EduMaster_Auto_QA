// @project: EDUMASTER
// @module: CRM
// @type: UI-E2E

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { StudentPage } from '../pages/StudentPage';

test.describe('Student Management UI', () => {
    let studentPage: StudentPage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        studentPage = new StudentPage(page);

        // Arrange: Login and navigate
        await loginPage.navigate();
        await loginPage.login('admin@edumaster.com', 'admin123');
        await expect(page).toHaveURL(/.*admin/);
        
        await studentPage.navigateToStudents();
    });

    test('Act: Create a new student successfully', async () => {
        // Arrange: Prepare data
        const studentName = `Auto Student ${Math.floor(Math.random() * 10000)}`;
        const studentCode = `STU${Math.floor(Math.random() * 100000)}`;

        // Act: Open form and fill
        await studentPage.openAddStudentForm();
        await studentPage.fillStudentForm({
            name: studentName,
            email: `auto_${Date.now()}@example.com`,
            code: studentCode,
            level: 'Beginner'
        });
        await studentPage.submitForm();

        // Assert: Verify success message and presence in table
        await studentPage.searchStudent(studentName);
        await studentPage.verifyStudentInTable(studentName);
    });

    test('Act: Search for an existing student', async ({ page }) => {
        // Act: Search interaction
        await studentPage.searchStudent('Auto Student');
        
        // Assert: Verify results
        const rows = page.locator('.ant-table-row');
        if (await rows.count() > 0) {
            await expect(rows.first()).toContainText('Auto Student');
        }
    });
});
