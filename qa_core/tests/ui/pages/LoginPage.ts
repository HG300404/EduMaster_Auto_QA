import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByPlaceholder('Email');
        this.passwordInput = page.getByPlaceholder('Password');
        this.loginBtn = page.getByRole('button', { name: 'Log in' });
    }

    async navigate() {
        await this.page.goto('/login');
    }

    async fillCredentials(email: string, pass: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(pass);
    }

    async submitLoginForm() {
        await this.loginBtn.click();
    }

    /** Successful login — waits for redirect to /admin. */
    async login(email: string, pass: string) {
        await this.fillCredentials(email, pass);
        await Promise.all([
            this.page.waitForURL(/\/admin/, { timeout: 20000 }),
            this.submitLoginForm(),
        ]);
    }
}
