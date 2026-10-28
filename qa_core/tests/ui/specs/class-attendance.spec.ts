// @project: EDUMASTER
// @module: Attendance
// @type: UI-E2E
import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { AttendancePage } from '../pages/AttendancePage';
import { createStudentViaApi, deleteClassViaApi, deleteStudentViaApi, getAdminToken } from '../helpers/sutApi';

test.describe('Class Attendance Tests', () => {
    test.describe.configure({ timeout: 90000 });

    let loginPage: LoginPage;
    let attendancePage: AttendancePage;
    let classId: string;
    let studentId: string;
    const studentName = `Att Tester ${Date.now()}`;
    const className = `Class ${Date.now()}`;

    test.beforeEach(async ({ page, request }) => {
        loginPage = new LoginPage(page);
        attendancePage = new AttendancePage(page);

        const token = await getAdminToken(request);
        const timestamp = Date.now();

        const student = await createStudentViaApi(request, token, {
            full_name: studentName,
            email: `att${timestamp}@test.com`,
            student_code: `ATT${timestamp}`,
        });
        studentId = student.id;

        const courseRes = await request.post('/api/course/', {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: `Course ${timestamp}`,
                code: `C-${timestamp}`,
                description: 'Attendance test course',
            },
        });
        expect(courseRes.ok()).toBeTruthy();
        const courseId = (await courseRes.json()).id;

        const classRes = await request.post('/api/class/', {
            headers: { Authorization: `Bearer ${token}` },
            data: { name: className, course_id: courseId, max_students: 20, schedule: [] },
        });
        expect(classRes.ok()).toBeTruthy();
        classId = (await classRes.json()).id;

        const enrollRes = await request.post(`/api/class/${classId}/students`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { student_id: studentId },
        });
        expect(enrollRes.ok()).toBeTruthy();

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    });

    test.afterEach(async ({ request }) => {
        const token = await getAdminToken(request);
        if (classId) {
            await deleteClassViaApi(request, token, classId).catch(() => {});
        }
        if (studentId) {
            await deleteStudentViaApi(request, token, studentId).catch(() => {});
        }
    });

    test('should create an attendance session and mark student as present', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open class attendance tab', async () => {
            await attendancePage.goToAttendance(classId);
        });

        await uiStep(page, testInfo, 'Open Create Session modal', async () => {
            await attendancePage.openCreateSessionModal();
        });

        await uiStep(page, testInfo, 'Fill session title in form', async () => {
            await attendancePage.fillSessionTitle('Morning Session');
        });

        await uiStep(page, testInfo, 'Submit session form', async () => {
            await attendancePage.submitSessionForm();
        });

        await uiStep(page, testInfo, 'Mark student as Present and save', async () => {
            await attendancePage.markAttendance(studentName, 'Present');
            await attendancePage.saveAttendance();
        });

        await uiStep(page, testInfo, 'Verify Present status in table', async () => {
            await attendancePage.verifyAttendanceStatus(studentName, 'Present');
        });
    });

    test('should display QR code modal successfully', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open class attendance tab', async () => {
            await attendancePage.goToAttendance(classId);
        });

        await uiStep(page, testInfo, 'Open Create Session modal', async () => {
            await attendancePage.openCreateSessionModal();
        });

        await uiStep(page, testInfo, 'Fill session title for QR', async () => {
            await attendancePage.fillSessionTitle('QR Session');
        });

        await uiStep(page, testInfo, 'Submit session form', async () => {
            await attendancePage.submitSessionForm();
        });

        await uiStep(page, testInfo, 'Open QR modal', async () => {
            await attendancePage.openQRModal();
        });

        await uiStep(page, testInfo, 'Close QR modal', async () => {
            await attendancePage.closeQRModal();
        });
    });

    test('should mark student as Absent and save', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open class attendance tab', async () => {
            await attendancePage.goToAttendance(classId);
        });

        await uiStep(page, testInfo, 'Open Create Session modal', async () => {
            await attendancePage.openCreateSessionModal();
        });

        await uiStep(page, testInfo, 'Fill session title in form', async () => {
            await attendancePage.fillSessionTitle('Absent Session');
        });

        await uiStep(page, testInfo, 'Submit session form', async () => {
            await attendancePage.submitSessionForm();
        });

        await uiStep(page, testInfo, 'Mark student as Absent and save', async () => {
            await attendancePage.markAttendance(studentName, 'Absent');
            await attendancePage.saveAttendance();
        });

        await uiStep(page, testInfo, 'Verify Absent status in table', async () => {
            await attendancePage.verifyAttendanceStatus(studentName, 'Absent');
        });
    });

    test('should mark student as Late and save', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open class attendance tab', async () => {
            await attendancePage.goToAttendance(classId);
        });

        await uiStep(page, testInfo, 'Open Create Session modal', async () => {
            await attendancePage.openCreateSessionModal();
        });

        await uiStep(page, testInfo, 'Fill session title in form', async () => {
            await attendancePage.fillSessionTitle('Late Session');
        });

        await uiStep(page, testInfo, 'Submit session form', async () => {
            await attendancePage.submitSessionForm();
        });

        await uiStep(page, testInfo, 'Mark student as Late and save', async () => {
            await attendancePage.markAttendance(studentName, 'Late');
            await attendancePage.saveAttendance();
        });

        await uiStep(page, testInfo, 'Verify Late status in table', async () => {
            await attendancePage.verifyAttendanceStatus(studentName, 'Late');
        });
    });

    test('should display attendance report after saving session', { tag: '@smoke' }, async ({ page }, testInfo) => {
        await uiStep(page, testInfo, 'Open class attendance tab', async () => {
            await attendancePage.goToAttendance(classId);
        });

        await uiStep(page, testInfo, 'Open Create Session modal', async () => {
            await attendancePage.openCreateSessionModal();
        });

        await uiStep(page, testInfo, 'Fill session title in form', async () => {
            await attendancePage.fillSessionTitle('Report Session');
        });

        await uiStep(page, testInfo, 'Submit session form', async () => {
            await attendancePage.submitSessionForm();
        });

        await uiStep(page, testInfo, 'Mark student Present and save for report', async () => {
            await attendancePage.markAttendance(studentName, 'Present');
            await attendancePage.saveAttendance();
        });

        await uiStep(page, testInfo, 'Open Reports tab', async () => {
            await attendancePage.goToReportsTab();
        });

        await uiStep(page, testInfo, 'Verify attendance report summary', async () => {
            await attendancePage.verifyAttendanceReportVisible();
        });
    });
});
