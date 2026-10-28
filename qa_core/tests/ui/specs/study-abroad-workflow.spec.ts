// @project: EDUMASTER
// @module: StudyAbroad
// @type: UI-E2E

import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { StudyAbroadApplicationPage } from '../pages/StudyAbroadApplicationPage';
import {
    createCandidateViaApi,
    createJobOrderViaApi,
    createStudyAbroadPartnerViaApi,
    getAdminToken,
} from '../helpers/sutApi';

test.describe('Study Abroad Application Workflow Tests', () => {
    test.describe.configure({ timeout: 120000 });

    let loginPage: LoginPage;
    let saPage: StudyAbroadApplicationPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        saPage = new StudyAbroadApplicationPage(page);

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    });

    test(
        'should create application and advance workflow stage',
        { tag: '@smoke' },
        async ({ page, request }, testInfo) => {
            const stamp = Date.now();
            const candidateName = `QA UI Candidate ${stamp}`;
            const partnerName = `QA UI Partner ${stamp}`;
            const jobTitle = `QA UI Job ${stamp}`;

            const token = await getAdminToken(request);
            const candidate = await createCandidateViaApi(request, token, {
                full_name: candidateName,
                email: `sa-ui-${stamp}@test.com`,
            });
            const partner = await createStudyAbroadPartnerViaApi(request, token, {
                name: partnerName,
                type: 'University',
            });
            await createJobOrderViaApi(request, token, {
                partner_id: partner.id,
                title: jobTitle,
            });

            await uiStep(page, testInfo, 'Open study abroad applications board', async () => {
                await saPage.goToApplicationsBoard();
            });

            await uiStep(page, testInfo, 'Create new application via modal', async () => {
                await saPage.openNewApplicationModal();
                await saPage.selectCandidateInModal(candidateName);
                await saPage.selectJobOrderInModal(jobTitle);
                await saPage.submitNewApplicationForm();
            });

            await uiStep(page, testInfo, 'Verify application appears in table', async () => {
                await saPage.verifyApplicationInTable(candidateName, jobTitle);
            });

            await uiStep(page, testInfo, 'Open application detail page', async () => {
                await saPage.openApplicationDetailFromTable(candidateName);
            });

            await uiStep(page, testInfo, 'Verify initial workflow stage checklist', async () => {
                await saPage.verifyChecklistStage('Initial Consultation');
            });

            await uiStep(page, testInfo, 'Complete checklist and advance stage', async () => {
                await saPage.completeAllChecklistItems();
                await saPage.advanceToNextStage();
            });

            await uiStep(page, testInfo, 'Verify workflow advanced to School Selection', async () => {
                await saPage.verifyChecklistStage('School Selection');
                await saPage.verifyWorkflowStepActive('School Selection');
            });

            expect(candidate.id).toBeTruthy();
        }
    );
});
