// @project: EDUMASTER
// @module: File Upload
// @type: UI-E2E

import path from 'path';
import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { FileManagerPage } from '../pages/FileManagerPage';
import { deleteFileViaApi, deleteFolderViaApi, getAdminToken, uploadFileViaApi } from '../helpers/sutApi';

const TEST_PDF = path.join(__dirname, '..', 'test-file.pdf');

test.describe('File Upload Tests', () => {
    test.describe.configure({ timeout: 120000 });

    let loginPage: LoginPage;
    let filePage: FileManagerPage;
    let folderId: string | undefined;
    let fileId: string | undefined;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        filePage = new FileManagerPage(page);

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    });

    test.afterEach(async ({ request }) => {
        const token = await getAdminToken(request);
        if (fileId) {
            await deleteFileViaApi(request, token, fileId).catch(() => {});
            fileId = undefined;
        }
        if (folderId) {
            await deleteFolderViaApi(request, token, folderId).catch(() => {});
            folderId = undefined;
        }
    });

    test('should upload a file and display it in file manager', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        await uiStep(page, testInfo, 'Open file manager page', async () => {
            await filePage.goToFileManager();
        });

        await uiStep(page, testInfo, 'Open upload dialog', async () => {
            await filePage.openUploadDialog();
        });

        await uiStep(page, testInfo, 'Upload PDF test file', async () => {
            await filePage.uploadLocalFile(TEST_PDF);
        });

        await uiStep(page, testInfo, 'Verify uploaded file is listed', async () => {
            await filePage.verifyFileVisible('test-file.pdf');
        });

        const token = await getAdminToken(request);
        const listRes = await request.get('/api/files/folders', {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(listRes.ok()).toBeTruthy();
        const body = await listRes.json();
        const match = (body.files as { id: string; name: string }[]).find((f) => f.name === 'test-file.pdf');
        expect(match).toBeTruthy();
        fileId = match!.id;
    });

    test('should create a folder in file manager', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        const folderName = `QA Folder ${Date.now()}`;

        await uiStep(page, testInfo, 'Open file manager page', async () => {
            await filePage.goToFileManager();
        });

        await uiStep(page, testInfo, 'Create new folder via prompt', async () => {
            await filePage.createFolder(folderName);
        });

        await uiStep(page, testInfo, 'Verify folder appears in grid', async () => {
            await filePage.verifyFolderVisible(folderName);
        });

        const token = await getAdminToken(request);
        const listRes = await request.get('/api/files/folders', {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(listRes.ok()).toBeTruthy();
        const body = await listRes.json();
        const match = (body.folders as { id: string; name: string }[]).find((f) => f.name === folderName);
        expect(match).toBeTruthy();
        folderId = match!.id;
    });

    test('should delete an uploaded file', async ({ page, request }, testInfo) => {
        const token = await getAdminToken(request);
        const uploaded = await uploadFileViaApi(request, token, TEST_PDF, 'qa-delete-ui.pdf');
        fileId = uploaded.id;

        await uiStep(page, testInfo, 'Open file manager page', async () => {
            await filePage.goToFileManager();
        });

        await uiStep(page, testInfo, 'Delete uploaded file from grid', async () => {
            await filePage.deleteFile('qa-delete-ui.pdf');
        });

        await uiStep(page, testInfo, 'Verify file removed from UI', async () => {
            await expect(page.getByText('qa-delete-ui.pdf', { exact: true })).toHaveCount(0);
        });

        fileId = undefined;
    });
});
