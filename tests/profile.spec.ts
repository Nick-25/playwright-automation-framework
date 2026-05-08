import { test } from '@playwright/test';
import { users } from './fixtures/users.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SignInPage } from './pages/SignInPage.js';

test.describe('profile', () => {
  test('requires a signed-in user before loading profile data', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await profilePage.goto();
    await profilePage.expectSession('Not signed in.');
    await profilePage.loadProfile();

    await profilePage.expectStatus('Please sign in to load your profile.');
  });

  test('loads the signed-in user profile from the app API', async ({ page }) => {
    const signInPage = new SignInPage(page);
    const profilePage = new ProfilePage(page);

    await signInPage.goto();
    await signInPage.signIn(users.ada.email, users.ada.password);
    await signInPage.expectSignedInAs(users.ada.name);

    await profilePage.goto();
    await profilePage.expectSession(`Signed in as ${users.ada.name}.`);
    await profilePage.loadProfile();

    await profilePage.expectStatus('Profile loaded.');
    await profilePage.expectProfile({
      name: users.ada.name,
      email: users.ada.email,
      role: users.ada.role,
      team: users.ada.team,
    });
  });

  test('loads a different profile for a different signed-in user', async ({ page }) => {
    const signInPage = new SignInPage(page);
    const profilePage = new ProfilePage(page);

    await signInPage.goto();
    await signInPage.signIn(users.grace.email, users.grace.password);
    await signInPage.expectSignedInAs(users.grace.name);

    await profilePage.goto();
    await profilePage.loadProfile();

    await profilePage.expectProfile({
      name: users.grace.name,
      email: users.grace.email,
      role: users.grace.role,
      team: users.grace.team,
    });
  });
});
