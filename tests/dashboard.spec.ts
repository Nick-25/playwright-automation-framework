import { expect, test } from './fixtures/pages.js';
import { users } from './fixtures/users.js';

test.describe('dashboard welcome page', () => {
  test('shows only the public welcome page with login actions when signed out', async ({ page, dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectPublicWelcome();

    await expect(dashboardPage.headerLogin).toHaveAttribute('href', '/sign-in');
    await expect(dashboardPage.heroLogin).toHaveAttribute('href', '/sign-in');
    await expect(page.getByAltText('Modern office workspace with desks and windows')).toBeVisible();
    await expect(page.getByText('Lorem ipsum dolor sit amet')).toBeVisible();
  });

  test('opens the login page from the hero login button', async ({ page, dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.heroLogin.click();

    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('shows dashboard metrics after a real user signs in', async ({ page, dashboardPage, signInPage }) => {
    await signInPage.goto();
    await signInPage.signIn(users.nick.email, users.nick.password);
    await expect(page).toHaveURL('/');

    await dashboardPage.expectAuthenticatedShell(users.nick.name);
    await dashboardPage.loadDashboard();
    const dashboardResponse = await page.request.get('/api/dashboard');
    const dashboard = await dashboardResponse.json();

    await expect(dashboardPage.status).toHaveText('Dashboard loaded.');
    await expect(dashboardPage.openMetric).toHaveText(String(dashboard.metrics.openTasks));
    await expect(dashboardPage.blockedMetric).toHaveText(String(dashboard.metrics.blockedTasks));
    await expect(dashboardPage.highPriorityMetric).toHaveText(String(dashboard.metrics.highPriorityTasks));
    await expect(dashboardPage.activityItems).toHaveCount(3);
  });

  test('logs out and returns to the public welcome page', async ({ page, dashboardPage, signInPage }) => {
    await signInPage.goto();
    await signInPage.signIn(users.ada.email, users.ada.password);
    await expect(page).toHaveURL('/');

    await dashboardPage.expectAuthenticatedShell(users.ada.name);
    await dashboardPage.logout();

    await dashboardPage.expectPublicWelcome();
  });
});
