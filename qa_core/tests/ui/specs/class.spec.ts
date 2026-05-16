// @project: EDUMASTER
// @module: LMS
// @type: UI-E2E

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClassPage } from '../pages/ClassPage';
import { StudentPage } from '../pages/StudentPage';

test.describe.serial('Class Management & Attendance UI Suite (UI + API Optimized)', () => {
    let classPage: ClassPage;
    let studentPage: StudentPage;

    // Arrange: Define shared data
    const timestamp = Date.now();
    const studentName = `Test Student ${timestamp}`;
    const studentCode = `S${timestamp.toString().slice(-6)}`;
    const className = `Test Class ${timestamp}`;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        classPage = new ClassPage(page);
        studentPage = new StudentPage(page);

        // Arrange: Login UI
        await loginPage.navigate();
        await loginPage.login('admin@edumaster.com', 'admin123');
        await expect(page).toHaveURL(/.*admin/);
    });

    test('Arrange: Create a student via UI', async ({ page }) => {
        // Ensuring full synchronization by creating via UI
        await studentPage.navigateToStudents();
        await studentPage.openAddStudentForm();
        await studentPage.fillStudentForm({
            name: studentName,
            email: `test_stu_${timestamp}@example.com`,
            code: studentCode
        });
        await studentPage.submitForm();
        
        // Verification
        await expect(page.locator('.ant-message-success').nth(0)).toBeVisible();
    });

    test('Act: Create a new class via UI', async ({ page }) => {
        await classPage.navigateToClasses();
        await classPage.createClass({
            name: className,
            course: 'Japanese' 
        });
        
        // Assert
        const row = await classPage.findClassRow(className);
        await expect(row).toBeVisible();
    });

    test('Act: Enroll the student', async ({ page }) => {
        // Act: Go to detail and enroll
        await classPage.navigateToClasses();
        await classPage.goToClassDetail(className);
        await classPage.enrollStudent(studentName);

        // Assert: Verify enrollment in the student list tab
        await classPage.studentTab.click();
        await expect(page.locator('tr.ant-table-row').filter({ hasText: studentName }).first()).toBeVisible();
    });

    test('Act: Take attendance for the student', async ({ page }) => {
        // Act: Mark attendance as Present
        await classPage.navigateToClasses();
        await classPage.goToClassDetail(className);
        await classPage.markAttendance(studentName, 'Present');
        
        // Assert: Verify success tag
        await expect(page.locator('.ant-tag', { hasText: /PRESENT/i }).first()).toBeVisible();
    });

    test('Act: Update attendance status to Excused', async ({ page }) => {
        // Act: Change status to Excused
        await classPage.navigateToClasses();
        await classPage.goToClassDetail(className);
        await classPage.markAttendance(studentName, 'Excused');
        
        // Assert: Verify updated tag
        await expect(page.locator('.ant-tag', { hasText: /EXCUSED/i }).first()).toBeVisible();
    });

    test('Act: Delete the class', async ({ page }) => {
        // Act: Delete
        await classPage.navigateToClasses();
        await classPage.deleteClass(className);
        
        // Assert
        const row = page.locator('tr.ant-table-row').filter({ hasText: className }).nth(0);
        await expect(row).toHaveCount(0);
    });
});
