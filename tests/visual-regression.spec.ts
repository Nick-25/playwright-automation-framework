import { expect, test } from './fixtures/pages.js';
import { signInWithStoredSession } from './helpers/auth.js';

test.describe('visual regression smoke', () => {
  test.skip(Boolean(process.env.CI), 'Run visual regression in a dedicated baseline environment.');
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual baselines are captured in Chromium.');

  test('captures the sign-in page baseline', async ({ page, signInPage }) => {
    await signInPage.goto();

    await expect(page).toHaveScreenshot('sign-in-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('captures the authenticated task page baseline', async ({ page, todoPage }) => {
    await signInWithStoredSession(page);
    await todoPage.goto();
    await todoPage.expectLoaded();

    await expect(page).toHaveScreenshot('task-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

