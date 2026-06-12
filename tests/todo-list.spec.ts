import { signInWithStoredSession } from './helpers/auth.js';
import { expect, test } from './fixtures/pages.js';

test.describe('todo list', () => {
  test.beforeEach(async ({ page }) => {
    await signInWithStoredSession(page);
  });

  test('shows existing tasks', async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.expectLoaded();
    await todoPage.searchFor('Review pull request');

    await expect(todoPage.summary).toHaveText(/1-1 of 1 task/);
    await todoPage.expectTaskVisible('Review pull request');
  });

  test('adds a new task', async ({ todoPage }) => {
    await todoPage.goto();
    const taskName = `Ship Playwright setup ${Date.now()}`;
    await todoPage.addTask(`  ${taskName}  `);
    await todoPage.searchFor(taskName);

    await todoPage.expectTaskVisible(taskName);
    await expect(todoPage.summary).toHaveText(/1-1 of 1 task/);
    await expect(todoPage.newTaskInput).toHaveValue('');
  });

  test('ignores blank tasks', async ({ todoPage }) => {
    await todoPage.goto();
    const initialCount = await todoPage.taskItems.count();
    await todoPage.addTask('   ');

    await expect(todoPage.taskItems).toHaveCount(initialCount);
  });

  test('marks a task complete', async ({ todoPage }) => {
    await todoPage.goto();
    const taskName = `Task to complete ${Date.now()}`;
    await todoPage.addTask(taskName);
    await todoPage.completeTask(taskName);

    await expect(todoPage.latestTaskRow(taskName).locator('td').nth(3)).toHaveText('Done');
  });

  test('deletes a task from the task table', async ({ todoPage }) => {
    await todoPage.goto();
    const taskName = `Task to delete ${Date.now()}`;

    await todoPage.addTask(taskName);
    await todoPage.searchFor(taskName);
    await todoPage.expectTaskVisible(taskName);
    await expect(todoPage.summary).toHaveText(/1-1 of 1 task/);

    await todoPage.deleteTask(taskName);

    await todoPage.expectTaskHidden(taskName);
    await expect(todoPage.summary).toHaveText(/0-0 of 0 tasks/);
    await expect(todoPage.status).toHaveText(`${taskName} deleted.`);
  });

  test('removes a completed task from the open task table', async ({ todoPage }) => {
    await todoPage.goto();
    const taskName = `Complete and remove ${Date.now()}`;

    await todoPage.addTask(taskName);
    await todoPage.searchFor(taskName);
    await todoPage.filterByStatus('Open');

    await todoPage.expectTaskRow({
      title: taskName,
      assignee: 'Ada Lovelace',
      priority: 'Medium',
      status: 'Open',
    });
    await expect(todoPage.summary).toHaveText(/1-1 of 1 task/);

    await todoPage.completeTask(taskName);

    await todoPage.expectTaskHidden(taskName);
    await expect(todoPage.summary).toHaveText(/0-0 of 0 tasks/);
  });

  test('filters the logged-in user tasks by search text and priority', async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.searchFor('review');
    await todoPage.filterByPriority('High');

    await expect(todoPage.summary).toHaveText(/1-1 of 1 task/);
    await todoPage.expectTaskVisible('Review pull request');
    await todoPage.expectTaskHidden('Update test plan');
  });

  test('finds a specific task row by task name', async ({ todoPage }) => {
    const taskName = `Find this task ${Date.now()}`;

    await todoPage.goto();
    await todoPage.addDetailedTask({
      title: taskName,
      assignee: 'Ada Lovelace',
      priority: 'Low',
      dueDate: '2026-05-31',
    });
    await todoPage.searchFor(taskName);

    await todoPage.expectTaskRow({
      title: taskName,
      assignee: 'Ada Lovelace',
      priority: 'Low',
      status: 'Open',
    });
    await expect(todoPage.summary).toHaveText(/1-1 of 1 task/);
  });

  test('paginates the task table after 10 rows', async ({ todoPage }) => {
    await todoPage.goto();
    const taskPrefix = `Paginated task ${Date.now()}`;

    for (let index = 0; index < 11; index += 1) {
      await todoPage.addTask(`${taskPrefix} ${index}`);
    }

    await todoPage.searchFor(taskPrefix);

    await expect(todoPage.taskItems).toHaveCount(10);
    await expect(todoPage.summary).toHaveText(/1-10 of 11 tasks/);
    await expect(todoPage.nextPageButton).toBeEnabled();
    await todoPage.nextPageButton.click();

    await todoPage.expectPageSummary('Page 2 of 2');
    await expect(todoPage.previousPageButton).toBeEnabled();
    await expect(todoPage.taskItems).toHaveCount(1);
    await expect(todoPage.summary).toHaveText(/11-11 of 11 tasks/);
  });
});
