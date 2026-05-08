import { expect, test } from '@playwright/test';
import { TodoPage } from './pages/TodoPage';

test.describe('todo list', () => {
  test('shows existing tasks', async ({ page }) => {
    const todoPage = new TodoPage(page);

    await todoPage.goto();
    await todoPage.expectLoaded();

    // POM keeps selector knowledge in one class while tests describe behavior.
    await expect(todoPage.taskItems).toHaveCount(2);
    await todoPage.expectTaskVisible('Review pull request');
  });

  test('adds a new task', async ({ page }) => {
    const todoPage = new TodoPage(page);

    await todoPage.goto();
    await todoPage.addTask('  Ship Playwright setup  ');

    // Web-first assertions automatically wait until the UI reaches this state.
    await expect(todoPage.taskItems).toHaveCount(3);
    await todoPage.expectTaskVisible('Ship Playwright setup');
    await expect(todoPage.newTaskInput).toHaveValue('');
  });

  test('ignores blank tasks', async ({ page }) => {
    const todoPage = new TodoPage(page);

    await todoPage.goto();
    await todoPage.addTask('   ');

    await expect(todoPage.taskItems).toHaveCount(2);
  });

  test('marks a task complete', async ({ page }) => {
    const todoPage = new TodoPage(page);

    await todoPage.goto();
    await todoPage.taskCheckbox('Review pull request').check();

    await expect(todoPage.taskCheckbox('Review pull request')).toBeChecked();
  });
});
