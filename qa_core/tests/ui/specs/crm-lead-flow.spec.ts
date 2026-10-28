// @project: EDUMASTER
// @module: CRM
// @type: UI-E2E

import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { CrmLeadPage } from '../pages/CrmLeadPage';
import {
    createLeadViaApi,
    deleteLeadViaApi,
    getAdminToken,
    getCrmStaffViaApi,
    skipIfCrmLeadApiBroken,
} from '../helpers/sutApi';

test.describe('CRM Lead Flow Tests', () => {
    test.describe.configure({ timeout: 90000 });

    let loginPage: LoginPage;
    let crmPage: CrmLeadPage;
    let leadId: string | undefined;
    let leadName: string;
    let leadEmail: string;

    test.beforeEach(async ({ page, request }) => {
        loginPage = new LoginPage(page);
        crmPage = new CrmLeadPage(page);

        await skipIfCrmLeadApiBroken(request, test.skip.bind(test));

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    });

    test.afterEach(async ({ request }) => {
        if (!leadId) return;
        const token = await getAdminToken(request);
        await deleteLeadViaApi(request, token, leadId).catch(() => {});
        leadId = undefined;
    });

    test('should create a lead from website source', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        const stamp = Date.now();
        leadName = `Web Lead ${stamp}`;
        leadEmail = `crm${stamp}@test.com`;
        await uiStep(page, testInfo, 'Open CRM lead list', async () => {
            await crmPage.goToLeadList();
        });

        await uiStep(page, testInfo, 'Open create lead modal', async () => {
            await crmPage.openCreateLeadModal();
        });

        await uiStep(page, testInfo, 'Fill lead contact details', async () => {
            await crmPage.fillLeadName(leadName);
            await crmPage.fillLeadEmail(leadEmail);
            await crmPage.fillLeadPhone('0901234567');
        });

        await uiStep(page, testInfo, 'Submit new lead form', async () => {
            await crmPage.submitCreateLeadForm();
        });

        await uiStep(page, testInfo, 'Verify lead appears in table', async () => {
            await crmPage.goToLeadList();
            await crmPage.verifyLeadInTable(leadName);
        });

        const token = await getAdminToken(request);
        const listRes = await request.get('/api/crm/leads', {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(listRes.ok()).toBeTruthy();
        const body = await listRes.json();
        const leads = body.data ?? body;
        const created = (leads as { id: string; name: string }[]).find((l) => l.name === leadName);
        expect(created).toBeTruthy();
        leadId = created!.id;
    });

    test('should update lead status to Contacted', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        const stamp = Date.now();
        const token = await getAdminToken(request);
        const lead = await createLeadViaApi(request, token, {
            name: `Status Lead ${stamp}`,
            email: `status${stamp}@test.com`,
            phone: '0907654321',
            source: 'Website',
        });
        leadId = lead.id;

        await uiStep(page, testInfo, 'Open lead detail page', async () => {
            await crmPage.goToLeadDetailById(lead.id, lead.name);
        });

        await uiStep(page, testInfo, 'Open edit lead modal', async () => {
            await crmPage.openEditModal();
        });

        await uiStep(page, testInfo, 'Change status to Contacted', async () => {
            await crmPage.selectLeadStatus('Contacted');
        });

        await uiStep(page, testInfo, 'Save lead update', async () => {
            await crmPage.submitUpdateLeadForm();
        });

        await uiStep(page, testInfo, 'Verify Contacted status on detail', async () => {
            await crmPage.verifyStatusOnDetail('Contacted');
        });
    });

    test('should assign lead to sales staff', async ({ page, request }, testInfo) => {
        const stamp = Date.now();
        const token = await getAdminToken(request);
        const staff = await getCrmStaffViaApi(request, token);
        expect(staff.length).toBeGreaterThan(0);

        const lead = await createLeadViaApi(request, token, {
            name: `Assign Lead ${stamp}`,
            email: `assign${stamp}@test.com`,
            phone: '0912345678',
            source: 'Referral',
        });
        leadId = lead.id;

        await uiStep(page, testInfo, 'Open lead detail page', async () => {
            await crmPage.goToLeadDetailById(lead.id, lead.name);
        });

        await uiStep(page, testInfo, 'Open edit lead modal', async () => {
            await crmPage.openEditModal();
        });

        await uiStep(page, testInfo, 'Assign lead to staff member', async () => {
            const assignField = page.locator('.ant-modal-content').filter({ hasText: /Edit Lead/i }).first()
                .locator('.ant-form-item').filter({ hasText: 'Assign To' });
            await assignField.locator('.ant-select').click();
            await page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
                .filter({ hasText: staff[0].full_name })
                .first()
                .click();
        });

        await uiStep(page, testInfo, 'Save assignment', async () => {
            await crmPage.submitUpdateLeadForm();
        });

        await uiStep(page, testInfo, 'Verify assignee on detail page', async () => {
            await crmPage.verifyAssigneeOnDetail(staff[0].full_name);
        });
    });
});
