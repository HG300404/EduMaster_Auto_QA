// @project: EDUMASTER
// @module: Shared
// @type: UI-E2E

import fs from 'fs';
import path from 'path';
import { Page, TestInfo, test } from '@playwright/test';

function sanitizeFileName(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

/** Attach a full-page PNG labelled for the QA portal (attachment name: step:<description>). */
export async function attachStepScreenshot(
    page: Page,
    testInfo: TestInfo,
    stepDescription: string
): Promise<void> {
    const body = await page.screenshot({ fullPage: true });
    const attachmentName = `step:${stepDescription}`;

    await testInfo.attach(attachmentName, {
        body,
        contentType: 'image/png',
    });

    const runId = process.env.QA_TEST_RUN_ID;
    if (!runId) {
        return;
    }

    const reportDir = process.env.QA_REPORT_DIR || path.join(process.cwd(), 'reports');
    fs.mkdirSync(reportDir, { recursive: true });

    const safeStep = sanitizeFileName(stepDescription);
    const filePath = path.join(reportDir, `run_${runId}_${safeStep}.png`);
    fs.writeFileSync(filePath, body);
}

/**
 * Run a labelled UI step and capture a screenshot when it finishes.
 * The description appears in the QA portal next to the screenshot.
 */
export async function uiStep(
    page: Page,
    testInfo: TestInfo,
    description: string,
    body: () => Promise<void>
): Promise<void> {
    await test.step(description, async () => {
        await body();
    });
    await attachStepScreenshot(page, testInfo, description);
}
