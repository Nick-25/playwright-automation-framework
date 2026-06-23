import { expect, type Locator, type Page } from '@playwright/test';

export class ProfilePage {
  readonly loadProfileButton: Locator;
  readonly session: Locator;
  readonly status: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly role: Locator;
  readonly team: Locator;

  constructor(private readonly page: Page) {
    this.loadProfileButton = page.getByRole('button', { name: 'Load profile' });
    this.session = page.getByTestId('profile-session');
    this.status = page.getByRole('status');
    this.name = page.getByTestId('profile-name');
    this.email = page.getByTestId('profile-email');
    this.role = page.getByTestId('profile-role');
    this.team = page.getByTestId('profile-team');
  }

  async goto() {
    await this.page.goto('/profile', { waitUntil: 'domcontentloaded' });
  }

  async loadProfile() {
    await this.loadProfileButton.click();
  }

  async expectSession(message: string) {
    await expect(this.session).toHaveText(message);
  }

  async expectStatus(message: string) {
    await expect(this.status).toHaveText(message);
  }

  async expectProfile(profile: { name: string; email: string; role: string; team: string }) {
    await expect(this.name).toHaveText(profile.name);
    await expect(this.email).toHaveText(profile.email);
    await expect(this.role).toHaveText(profile.role);
    await expect(this.team).toHaveText(profile.team);
  }
}
