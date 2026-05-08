import { expect, test } from '@playwright/test';
import { users } from './fixtures/users';
import { SignInPage } from './pages/SignInPage';

test.describe('sign in', () => {
  test('lists the real users available in the practice app', async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();

    await expect(signInPage.sampleUsers).toHaveText([
      `${users.ada.name} (${users.ada.email})`,
      `${users.grace.name} (${users.grace.email})`,
    ]);
  });

  test('validates fields before sending credentials', async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    await signInPage.signIn('not-an-email', 'short');

    await signInPage.expectStatus('Please fix the highlighted fields.');
    await signInPage.expectFieldErrors({
      email: 'Enter a valid email address.',
      password: 'Password must be at least 8 characters.',
    });
    await expect(signInPage.emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(signInPage.passwordInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('rejects unknown credentials', async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    await signInPage.signIn('person@example.com', 'long-enough-password');

    await signInPage.expectStatus('Email or password is incorrect.');
  });

  test('signs in a real user and persists their session', async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    await signInPage.signIn(users.ada.email, users.ada.password);

    await signInPage.expectSignedInAs(users.ada.name);
    await expect
      .poll(async () =>
        page.evaluate(() => JSON.parse(localStorage.getItem('pom-practice-auth') ?? '{}').user?.email),
      )
      .toBe(users.ada.email);
  });
});
