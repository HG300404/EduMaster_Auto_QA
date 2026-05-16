import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage POM for EDUMASTER
 * @module CRM | LMS
 */
export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly sidebarMenu: Locator;
  readonly statsCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByTestId('welcome-text');
    this.sidebarMenu = page.getByTestId('sidebar-nav');
    this.statsCards = page.locator('.stats-card'); 
  }

  async isVisible() {
    return await this.welcomeMessage.isVisible();
  }

  async navigateTo(module: 'students' | 'classes' | 'courses') {
    await this.page.click(`[data-testid="nav-${module}"]`);
  }
}
