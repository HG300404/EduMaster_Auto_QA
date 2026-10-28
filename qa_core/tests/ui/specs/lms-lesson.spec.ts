// @project: EDUMASTER
// @module: LMS
// @type: UI-E2E
import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { LMSPage } from '../pages/LMSPage';
import { createCourseViaApi, deleteCourseViaApi, getAdminToken } from '../helpers/sutApi';
import path from 'path';

test.describe('LMS Lesson Management Tests', () => {
    test.describe.configure({ timeout: 90000 });

    let loginPage: LoginPage;
    let lmsPage: LMSPage;
    let courseId: string;
    const courseName = `LMS Course ${Date.now()}`;

    test.beforeEach(async ({ page, request }) => {
        loginPage = new LoginPage(page);
        lmsPage = new LMSPage(page);

        const token = await getAdminToken(request);
        const timestamp = Date.now();

        const course = await createCourseViaApi(request, token, {
            name: `${courseName} ${timestamp}`,
            code: `LMS-${timestamp}`,
            description: 'LMS UI automation course',
        });
        courseId = course.id;

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    });

    test.afterEach(async ({ request }) => {
        const token = await getAdminToken(request);
        if (courseId) {
            await deleteCourseViaApi(request, token, courseId).catch(() => {});
        }
    });

    test('should create a text lesson successfully', { tag: '@smoke' }, async ({ page }, testInfo) => {
        const lessonTitle = 'Introduction to Automation';
        const lessonText = 'This is a sample text for the lesson.';

        await uiStep(page, testInfo, 'Open course admin page', async () => {
            await lmsPage.goToCourseAdmin(courseId);
        });

        await uiStep(page, testInfo, 'Open create lesson form', async () => {
            await lmsPage.openCreateLessonForm();
        });

        await uiStep(page, testInfo, 'Fill lesson title in form', async () => {
            await lmsPage.fillLessonTitle(lessonTitle);
        });

        await uiStep(page, testInfo, 'Fill lesson content text', async () => {
            await lmsPage.fillLessonContentText(lessonText);
        });

        await uiStep(page, testInfo, 'Submit lesson form', async () => {
            await lmsPage.submitLessonForm();
        });

        await uiStep(page, testInfo, 'Verify lesson visible in course list', async () => {
            await lmsPage.verifyLessonInCourseList(lessonTitle);
        });
    });

    test('should create a PDF document lesson with file upload', { tag: '@smoke' }, async ({ page }, testInfo) => {
        const lessonTitle = 'Playwright Documentation';
        const filePath = path.resolve(__dirname, '../test-file.pdf');

        await uiStep(page, testInfo, 'Open course admin page', async () => {
            await lmsPage.goToCourseAdmin(courseId);
        });

        await uiStep(page, testInfo, 'Open create lesson form', async () => {
            await lmsPage.openCreateLessonForm();
        });

        await uiStep(page, testInfo, 'Fill lesson title and select PDF type', async () => {
            await lmsPage.fillLessonTitle(lessonTitle);
            await lmsPage.selectContentType('pdf');
        });

        await uiStep(page, testInfo, 'Upload PDF file in form', async () => {
            await lmsPage.uploadLessonFile(filePath);
        });

        await uiStep(page, testInfo, 'Fill external PDF URL', async () => {
            await lmsPage.fillExternalUrl('https://example.com/playwright-doc.pdf');
        });

        await uiStep(page, testInfo, 'Submit lesson form', async () => {
            await lmsPage.submitLessonForm();
        });

        await uiStep(page, testInfo, 'Verify PDF lesson visible in course list', async () => {
            await lmsPage.verifyLessonInCourseList(lessonTitle);
        });
    });

    test('should create a video lesson successfully', { tag: '@smoke' }, async ({ page }, testInfo) => {
        const lessonTitle = 'Automation Video Intro';

        await uiStep(page, testInfo, 'Open course admin page', async () => {
            await lmsPage.goToCourseAdmin(courseId);
        });

        await uiStep(page, testInfo, 'Open create lesson form', async () => {
            await lmsPage.openCreateLessonForm();
        });

        await uiStep(page, testInfo, 'Fill video lesson title and URL', async () => {
            await lmsPage.fillVideoLessonForm(
                lessonTitle,
                'https://example.com/automation-intro.mp4'
            );
        });

        await uiStep(page, testInfo, 'Submit lesson form', async () => {
            await lmsPage.submitLessonForm();
        });

        await uiStep(page, testInfo, 'Verify video lesson visible in course list', async () => {
            await lmsPage.verifyLessonInCourseList(lessonTitle);
        });
    });
});
