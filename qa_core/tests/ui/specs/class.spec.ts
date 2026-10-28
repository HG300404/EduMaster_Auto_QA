// @project: EDUMASTER
// @module: LMS
// @type: UI-E2E

import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { ClassPage } from '../pages/ClassPage';

test.describe.serial('Class Management & Attendance UI Suite (UI + API Optimized)', () => {
    let classPage: ClassPage;
    let studentName = '';
    let classId = '';
    let classDetailPath = '';

    const timestamp = Date.now();
    const className = `Test Class ${timestamp}`;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        classPage = new ClassPage(page);

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/.*admin/);
    });

    test('Act: Create a new class via UI', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Navigate to Classes page', async () => {
            await classPage.navigateToClasses();
        });

        await uiStep(page, testInfo, 'Create new class via UI form', async () => {
            classId = await classPage.createClass({
                name: className,
                course: 'Japanese',
            });
        });

        await uiStep(page, testInfo, 'Verify class detail page', async () => {
            classDetailPath = `/admin/classes/${classId}`;
            await page.goto(classDetailPath);
            await expect(page.getByText(className, { exact: true })).toBeVisible({ timeout: 10000 });
        });
    });

    test('Act: Enroll the student', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open class detail page', async () => {
            await page.goto(classDetailPath);
            await page.waitForURL(/\/admin\/classes\/\w+/);
        });

        await uiStep(page, testInfo, 'Enroll student in class', async () => {
            studentName = await classPage.enrollStudent();
        });

        await uiStep(page, testInfo, 'Verify student in Students tab', async () => {
            await classPage.studentTab.click();
            await expect(
                page.locator('tr.ant-table-row').filter({ hasText: studentName }).first()
            ).toBeVisible();
        });
    });

    test('Act: Take attendance for the student', async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open class detail page', async () => {
            await page.goto(classDetailPath);
            await page.waitForURL(/\/admin\/classes\/\w+/);
        });

        await uiStep(page, testInfo, 'Mark student as Present', async () => {
            await classPage.markAttendance(studentName, 'Present');
        });

        await uiStep(page, testInfo, 'Verify Present status tag', async () => {
            await expect(
                page.locator('.ant-tabs-tabpane-active').locator('.ant-tag', { hasText: /PRESENT/i }).first()
            ).toBeVisible();
        });
    });

    test('Act: Update attendance status to Excused', async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open class detail page', async () => {
            await page.goto(classDetailPath);
            await page.waitForURL(/\/admin\/classes\/\w+/);
        });

        await uiStep(page, testInfo, 'Mark student as Excused', async () => {
            await classPage.markAttendance(studentName, 'Excused');
        });

        await uiStep(page, testInfo, 'Verify Excused status tag', async () => {
            await expect(
                page.locator('.ant-tabs-tabpane-active').locator('.ant-tag', { hasText: /EXCUSED/i }).first()
            ).toBeVisible();
        });
    });

    test('Act: Delete the class', async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Delete class via API cleanup', async () => {
            await classPage.deleteClassById(classId);
        });

        await uiStep(page, testInfo, 'Verify class removed from list', async () => {
            await classPage.navigateToClasses();
            await expect(page.locator('tr.ant-table-row').filter({ hasText: className })).toHaveCount(0);
        });
    });
});
