import { expect, type Locator, type Page } from '@playwright/test';

export class TodoPage {
  readonly heading: Locator;
  readonly newTaskInput: Locator;
  readonly addButton: Locator;
  readonly taskItems: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Team Tasks' });
    this.newTaskInput = page.getByPlaceholder('Write a task');
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.taskItems = page.getByRole('listitem');
  }

  async goto() {
    await this.page.goto('/todos');
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async addTask(taskName: string) {
    await this.newTaskInput.fill(taskName);
    await this.addButton.click();
  }

  taskCheckbox(taskName: string) {
    return this.page.getByLabel(taskName);
  }

  async expectTaskVisible(taskName: string) {
    await expect(this.page.getByText(taskName)).toBeVisible();
  }
}
