import AxeBuilder from '@axe-core/playwright';
import { type Page } from '@playwright/test';
import { expect, test } from './fixtures/pages.js';
import { signInWithStoredSession } from './helpers/auth.js';

async function expectNoAccessibilityViolations(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations, `${context} accessibility violations`).toEqual([]);
}

test.describe('accessibility smoke', () => {
  test('has no WCAG violations on public entry points', async ({ page, dashboardPage, signInPage }) => {
    await dashboardPage.goto();
    await expectNoAccessibilityViolations(page, 'Welcome page');

    await signInPage.goto();
    await expectNoAccessibilityViolations(page, 'Sign-in page');
  });

  test('has no WCAG violations on authenticated task workflow', async ({ page, todoPage }) => {
    await signInWithStoredSession(page);
    await todoPage.goto();
    await todoPage.expectLoaded();

    await expectNoAccessibilityViolations(page, 'Task page');
  });
});
