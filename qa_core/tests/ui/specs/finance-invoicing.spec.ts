// @project: EDUMASTER
// @module: Finance
// @type: UI-E2E

import { test, expect, uiStep } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { FinanceInvoicePage } from '../pages/FinanceInvoicePage';
import {
    createInvoiceViaApi,
    createStudentViaApi,
    getAdminToken,
} from '../helpers/sutApi';

test.describe('Finance Invoicing Tests', () => {
    test.describe.configure({ timeout: 120000 });

    let loginPage: LoginPage;
    let financePage: FinanceInvoicePage;
    let studentId: string;
    let studentCode: string;
    let uiStudentCode: string;
    let invoiceId: string | undefined;
    const tuitionAmount = 2_000_000;

    test.beforeEach(async ({ page, request }) => {
        const stamp = Date.now();
        loginPage = new LoginPage(page);
        financePage = new FinanceInvoicePage(page);

        const token = await getAdminToken(request);
        const studentCodeValue = `FIN${stamp}`;
        const studentName = `Finance Student ${stamp}`;
        const student = await createStudentViaApi(request, token, {
            full_name: studentName,
            email: `fin${stamp}@test.com`,
            student_code: studentCodeValue,
        });
        studentId = student.id;
        studentCode = studentCodeValue;

        const listRes = await request.get('/api/student/?page=1&per_page=1', {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(listRes.ok()).toBeTruthy();
        const listBody = await listRes.json();
        const firstStudent = (listBody.items ?? [])[0] as { student_code: string } | undefined;
        expect(firstStudent).toBeTruthy();
        uiStudentCode = firstStudent!.student_code;

        await loginPage.navigate();
        await loginPage.login(
            process.env.ADMIN_EMAIL || 'admin@edumaster.com',
            process.env.ADMIN_PASSWORD || 'admin123'
        );
        await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });
    });

    test('should create a tuition invoice via UI', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        await uiStep(page, testInfo, 'Open new invoice form', async () => {
            await financePage.goToCreateInvoice();
        });

        await uiStep(page, testInfo, 'Select student and dates', async () => {
            await financePage.selectStudent(uiStudentCode);
            await financePage.pickDateByLabel('Issue Date');
            await financePage.pickDateByLabel('Due Date');
        });

        await uiStep(page, testInfo, 'Fill invoice line item', async () => {
            await financePage.fillLineItem('Monthly Tuition', tuitionAmount);
        });

        await uiStep(page, testInfo, 'Submit invoice form', async () => {
            await financePage.submitCreateInvoice();
        });

        await uiStep(page, testInfo, 'Verify invoice created via API', async () => {
            const token = await getAdminToken(request);
            const listRes = await request.get('/api/finance/invoices', {
                headers: { Authorization: `Bearer ${token}` },
                params: { per_page: 20, page: 1 },
            });
            expect(listRes.ok()).toBeTruthy();
            const body = await listRes.json();
            const payload = body.data ?? body;
            const items = payload.items as { id: string; total_amount: number }[];
            const invoice = items.find((i) => i.total_amount === tuitionAmount);
            expect(invoice).toBeTruthy();
            invoiceId = invoice!.id;
        });
    });

    test('should record payment and mark invoice as Paid', { tag: '@smoke' }, async ({ page, request }, testInfo) => {
        const token = await getAdminToken(request);
        const today = new Date();
        const due = new Date(today);
        due.setDate(due.getDate() + 30);

        const invoice = await createInvoiceViaApi(request, token, {
            student_id: studentId,
            issue_date: today.toISOString().slice(0, 10),
            due_date: due.toISOString().slice(0, 10),
            total_amount: tuitionAmount,
            status: 'Unpaid',
            items: [
                {
                    description: 'Tuition Fee',
                    quantity: 1,
                    unit_price: tuitionAmount,
                    amount: tuitionAmount,
                },
            ],
        });
        invoiceId = invoice.id;

        await uiStep(page, testInfo, 'Open invoice detail page', async () => {
            await financePage.goToInvoiceDetail(invoice.id);
        });

        await uiStep(page, testInfo, 'Verify invoice is Unpaid', async () => {
            await financePage.verifyInvoiceStatus('Unpaid');
        });

        await uiStep(page, testInfo, 'Open record payment modal', async () => {
            await financePage.openRecordPaymentModal();
        });

        await uiStep(page, testInfo, 'Submit full payment', async () => {
            await financePage.fillPaymentMethod('Cash');
            await financePage.submitPayment();
        });

        await uiStep(page, testInfo, 'Verify Paid status on detail', async () => {
            await financePage.verifyInvoiceStatus('Paid');
        });
    });

    test('should download invoice PDF receipt', async ({ page, request }, testInfo) => {
        const token = await getAdminToken(request);
        const today = new Date();
        const due = new Date(today);
        due.setDate(due.getDate() + 30);

        const invoice = await createInvoiceViaApi(request, token, {
            student_id: studentId,
            issue_date: today.toISOString().slice(0, 10),
            due_date: due.toISOString().slice(0, 10),
            total_amount: tuitionAmount,
            status: 'Unpaid',
            items: [
                {
                    description: 'Tuition Fee',
                    quantity: 1,
                    unit_price: tuitionAmount,
                    amount: tuitionAmount,
                },
            ],
        });
        invoiceId = invoice.id;

        await uiStep(page, testInfo, 'Open invoice detail page', async () => {
            await financePage.goToInvoiceDetail(invoice.id);
        });

        await uiStep(page, testInfo, 'Download invoice PDF', async () => {
            const download = await financePage.downloadInvoicePdf();
            expect(download.suggestedFilename()).toMatch(/invoice_.*\.pdf/i);
        });
    });
});
