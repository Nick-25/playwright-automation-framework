import { expect, type Locator, type Page } from '@playwright/test';

export class SignInPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly status: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly sampleUsers: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.status = page.getByRole('status');
    this.emailError = page.getByTestId('email-error');
    this.passwordError = page.getByTestId('password-error');
    this.sampleUsers = page.getByTestId('sample-users').getByRole('listitem');
  }

  async goto() {
    await this.page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(this.sampleUsers).toHaveCount(3);
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    const canSubmit = await this.emailInput.evaluate(input => (input as HTMLInputElement).form?.checkValidity() ?? false);

    if (!canSubmit) {
      await this.signInButton.click();
      await expect(this.status).toHaveText('Please fix the highlighted fields.');
      return;
    }

    const loginResponse = this.page.waitForResponse(response => {
      const url = new URL(response.url());

      return url.pathname === '/api/login' && response.request().method() === 'POST';
    });

    await this.signInButton.click();
    const response = await loginResponse;

    if (response.ok()) {
      await expect(this.page).toHaveURL('/');
      return;
    }

    await expect(this.status).not.toHaveText('Signing in...');
  }

  async expectStatus(message: string) {
    await expect(this.status).toHaveText(message);
  }

  async expectFieldErrors(errors: { email?: string; password?: string }) {
    if (errors.email !== undefined) {
      await expect(this.emailError).toHaveText(errors.email);
    }

    if (errors.password !== undefined) {
      await expect(this.passwordError).toHaveText(errors.password);
    }
  }
}
