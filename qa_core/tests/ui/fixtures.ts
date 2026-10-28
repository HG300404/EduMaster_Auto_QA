// @project: EDUMASTER
// @module: Shared
// @type: UI-E2E

import { test as base, expect } from '@playwright/test';
import { attachStepScreenshot } from './helpers/screenshot';

export const test = base;

export { expect };
export { uiStep, attachStepScreenshot } from './helpers/screenshot';

test.afterEach(async ({ page }, testInfo) => {
    try {
        if (page.isClosed()) {
            return;
        }
        // On failure, always capture — passed runs rely on uiStep() descriptions
        if (testInfo.status !== testInfo.expectedStatus) {
            await attachStepScreenshot(page, testInfo, 'Failure snapshot');
        }
    } catch {
        // Page may already be closed when a test fails early
    }
});
