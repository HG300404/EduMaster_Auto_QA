// @project: EDUMASTER
// @module: CRM
// @type: UI-E2E

import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { StudentPage } from '../pages/StudentPage';
import {
    createStudentViaApi,
    deleteStudentViaApi,
    findStudentIdByEmail,
    getAdminToken,
} from '../helpers/sutApi';

test.describe('Student Management UI', () => {
    let studentPage: StudentPage;
    let adminToken: string;
    let seededStudentId: string | undefined;
    let createdStudentEmail: string | undefined;

    test.beforeEach(async ({ page, request }) => {
        adminToken = await getAdminToken(request);
        seededStudentId = undefined;
        createdStudentEmail = undefined;

        const loginPage = new LoginPage(page);
        studentPage = new StudentPage(page);

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/.*admin/);

        await studentPage.navigateToStudents();
    });

    test.afterEach(async ({ request }) => {
        if (seededStudentId) {
            await deleteStudentViaApi(request, adminToken, seededStudentId);
            seededStudentId = undefined;
        }
        if (createdStudentEmail) {
            const id = await findStudentIdByEmail(request, adminToken, createdStudentEmail);
            if (id) {
                await deleteStudentViaApi(request, adminToken, id);
            }
            createdStudentEmail = undefined;
        }
    });

    test('should create a new student successfully', { tag: '@smoke' }, async ({ page }, testInfo) => {
        const timestamp = Date.now();
        const studentName = `Auto Student ${timestamp}`;
        const studentCode = `STU${timestamp}`;
        const studentEmail = `auto_${timestamp}@example.com`;
        createdStudentEmail = studentEmail;

        await uiStep(page, testInfo, 'Open Add Student form', async () => {
            await studentPage.openAddStudentForm();
        });

        await uiStep(page, testInfo, 'Fill student form fields', async () => {
            await studentPage.fillStudentForm({
                name: studentName,
                email: studentEmail,
                code: studentCode,
                phone: '0912345678',
            });
        });

        await uiStep(page, testInfo, 'Submit student form', async () => {
            await studentPage.submitForm();
        });

        await uiStep(page, testInfo, 'Verify student visible in table', async () => {
            await studentPage.searchStudent(studentName);
            await studentPage.verifyStudentInTable(studentName);
        });
    });

    test('should search for a student provisioned via API', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        const timestamp = Date.now();
        const studentName = `Search Student ${timestamp}`;
        const studentEmail = `search_${timestamp}@example.com`;
        const studentCode = `SRC${timestamp}`;

        await test.step('Arrange (API): provision student', async () => {
            const created = await createStudentViaApi(request, adminToken, {
                full_name: studentName,
                email: studentEmail,
                student_code: studentCode,
            });
            seededStudentId = created.id;
        });

        await uiStep(page, testInfo, 'Search student on Students page', async () => {
            await expect(page).toHaveURL(/\/admin\/students/);
            await studentPage.searchStudent(studentName);
        });

        await uiStep(page, testInfo, 'Verify student visible in table', async () => {
            await studentPage.verifyStudentInTable(studentName);
            await expect(
                page.locator('tr.ant-table-row').filter({ hasText: studentName }).first()
            ).toBeVisible();
        });

        await test.step('Cleanup (API): delete provisioned student', async () => {
            if (seededStudentId) {
                await deleteStudentViaApi(request, adminToken, seededStudentId);
                seededStudentId = undefined;
            }
        });
    });
});
