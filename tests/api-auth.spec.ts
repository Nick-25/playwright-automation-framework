import { expect, test } from '@playwright/test';
import { users } from './fixtures/users.js';
import { deleteTaskIfPresent, deleteUserIfPresent, login } from './helpers/api.js';

type PublicUser = {
  email: string;
};

test.describe('JWT API access', () => {
  test('creates a 4 hour JWT session cookie at login', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: {
        email: users.ada.email,
        password: users.ada.password,
      },
    });
    const body = await response.json();

    expect(response.headers()['set-cookie']).toContain('session_token=');
    expect(response.headers()['set-cookie']).toContain('Max-Age=14400');
    expect(body.token.split('.')).toHaveLength(3);
    expect(body.expiresIn).toBe(14400);
  });

  test('returns only the current user when called with a regular user token', async ({ request }) => {
    const auth = await login(request, users.ada);
    const response = await request.get('/api/user-info', {
      headers: {
        authorization: `Bearer ${auth.token}`,
      },
    });
    const body = await response.json();

    expect(response.ok()).toBeTruthy();
    expect(body.users).toHaveLength(1);
    expect(body.users[0]).toMatchObject({
      email: users.ada.email,
      access: 'user',
    });
  });

  test('restores the current user from the session cookie', async ({ request }) => {
    await login(request, users.grace);
    const response = await request.get('/api/session');
    const body = await response.json();

    expect(response.ok()).toBeTruthy();
    expect(body.user.email).toBe(users.grace.email);
    expect(body.token.split('.')).toHaveLength(3);
  });

  test('returns all users when called with an admin token', async ({ request }) => {
    const auth = await login(request, users.admin);
    const response = await request.get('/api/user-info', {
      headers: {
        authorization: `Bearer ${auth.token}`,
      },
    });
    const body = await response.json();

    expect(response.ok()).toBeTruthy();
    expect(body.users.map((user: PublicUser) => user.email)).toEqual(
      expect.arrayContaining([users.ada.email, users.grace.email, users.nick.email, users.admin.email]),
    );
  });

  test('rejects user info requests without a valid token', async ({ request }) => {
    const response = await request.get('/api/user-info');
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.message).toBe('A valid session token is required.');
  });

  test('creates a longer-lived Postman token with the signing key', async ({ request }) => {
    const response = await request.post('/api/dev-token', {
      headers: {
        'x-signing-key': 'local-postman-key',
      },
      data: {
        email: users.admin.email,
        expiresInHours: 48,
      },
    });
    const body = await response.json();

    expect(response.ok()).toBeTruthy();
    expect(body.token.split('.')).toHaveLength(3);
    expect(body.expiresIn).toBe(172800);
    expect(body.user.email).toBe(users.admin.email);
  });

  test('creates a non-expiring Postman token with the signing key', async ({ request }) => {
    const response = await request.post('/api/dev-token', {
      headers: {
        'x-signing-key': 'local-postman-key',
      },
      data: {
        email: users.nick.email,
        expiresInHours: 'never',
      },
    });
    const body = await response.json();

    expect(response.ok()).toBeTruthy();
    expect(body.token.split('.')).toHaveLength(3);
    expect(body.expiresIn).toBeNull();
    expect(body.user.email).toBe(users.nick.email);
  });

  test('rejects dev token requests without the signing key', async ({ request }) => {
    const response = await request.post('/api/dev-token', {
      data: {
        email: users.admin.email,
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.message).toBe('A valid signing key is required.');
  });
});

test.describe('admin user management API', () => {
  test('allows an admin to add and delete a user', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    let createdUserId: string | undefined;

    try {
      const createResponse = await request.post('/api/users', {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
        data: {
          email: `pat-${Date.now()}@example.com`,
          password: 'pat-12345',
          name: 'Pat Analyst',
          role: 'Data Analyst',
          team: 'Reporting',
          access: 'user',
        },
      });
      const createBody = await createResponse.json();
      createdUserId = createBody.user.id;

      expect(createResponse.status()).toBe(201);
      expect(createBody.user).toMatchObject({
        name: 'Pat Analyst',
        access: 'user',
      });

      const userInfoResponse = await request.get('/api/user-info', {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
      });
      const userInfoBody = await userInfoResponse.json();

      expect(userInfoBody.users.map((user: PublicUser) => user.email)).toContain(createBody.user.email);

      const deleteResponse = await request.delete(`/api/users/${createBody.user.id}`, {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
      });
      const deleteBody = await deleteResponse.json();
      createdUserId = undefined;

      expect(deleteResponse.ok()).toBeTruthy();
      expect(deleteBody.deletedUser.email).toBe(createBody.user.email);
    } finally {
      await deleteUserIfPresent(request, adminAuth.token, createdUserId);
    }
  });

  test('blocks regular users from adding users', async ({ request }) => {
    const userAuth = await login(request, users.ada);
    const response = await request.post('/api/users', {
      headers: {
        authorization: `Bearer ${userAuth.token}`,
      },
      data: {
        email: 'blocked@example.com',
        password: 'blocked-123',
        name: 'Blocked User',
        role: 'Analyst',
        team: 'Reporting',
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(403);
    expect(body.message).toBe('Admin access is required.');
  });

  test('validates duplicate users', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const response = await request.post('/api/users', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
      data: {
        email: users.ada.email,
        password: 'duplicate-123',
        name: 'Duplicate Ada',
        role: 'Analyst',
        team: 'Reporting',
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(409);
    expect(body.message).toBe('A user with this email already exists.');
  });

  test('validates required user creation fields', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const response = await request.post('/api/users', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
      data: {
        email: `missing-fields-${Date.now()}@example.com`,
        password: 'missing-123',
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.message).toBe('Email, password, name, role, and team are required.');
  });

  test('returns not found when deleting an unknown user', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const response = await request.delete('/api/users/not-a-real-user', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.message).toBe('User not found.');
  });
});

test.describe('task API', () => {
  test('adds tasks to any user but only returns the logged-in users tasks', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    let createdUserId: string | undefined;

    try {
      const createUserResponse = await request.post('/api/users', {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
        data: {
          email: `task-owner-${Date.now()}@example.com`,
          password: 'task-owner-123',
          name: 'Task Owner',
          role: 'Analyst',
          team: 'Reporting',
        },
      });
      const createUserBody = await createUserResponse.json();

      expect(createUserResponse.status()).toBe(201);
      createdUserId = createUserBody.user.id;

      const createTaskResponse = await request.post('/api/tasks', {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
        data: {
          title: 'Validate enrollment extract',
          assigneeId: createUserBody.user.id,
          priority: 'High',
          dueDate: '2026-05-22',
        },
      });
      const createTaskBody = await createTaskResponse.json();

      expect(createTaskResponse.status()).toBe(201);
      expect(createTaskBody.task).toMatchObject({
        title: 'Validate enrollment extract',
        assignee: 'Task Owner',
        status: 'Open',
      });

      const adminTasksResponse = await request.get('/api/tasks', {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
      });
      const adminTasksBody = await adminTasksResponse.json();

      expect(adminTasksBody.tasks.map((task: { id: string }) => task.id)).not.toContain(createTaskBody.task.id);

      const ownerAuth = await login(request, {
        ...createUserBody.user,
        password: 'task-owner-123',
      });
      const ownerTasksResponse = await request.get('/api/tasks', {
        headers: {
          authorization: `Bearer ${ownerAuth.token}`,
        },
      });
      const ownerTasksBody = await ownerTasksResponse.json();

      expect(ownerTasksBody.tasks.map((task: { id: string }) => task.id)).toContain(createTaskBody.task.id);
    } finally {
      if (createdUserId) {
        await deleteUserIfPresent(request, adminAuth.token, createdUserId);
      }
    }
  });

  test('marks the logged-in users task complete through the API', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    let createdTaskId: string | undefined;

    try {
      const createTaskResponse = await request.post('/api/tasks', {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
        data: {
          title: 'Publish weekly quality report',
          assigneeId: users.admin.id,
          priority: 'Medium',
          dueDate: '2026-05-25',
        },
      });
      const createTaskBody = await createTaskResponse.json();
      createdTaskId = createTaskBody.task.id;
      const completeResponse = await request.patch(`/api/tasks/${createTaskBody.task.id}/complete`, {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
      });
      const completeBody = await completeResponse.json();

      expect(completeResponse.ok()).toBeTruthy();
      expect(completeBody.task.status).toBe('Done');
    } finally {
      await deleteTaskIfPresent(request, adminAuth.token, createdTaskId);
    }
  });

  test('deletes the logged-in users task through the API', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const createTaskResponse = await request.post('/api/tasks', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
      data: {
        title: 'Delete weekly quality report',
        assigneeId: users.admin.id,
        priority: 'Low',
        dueDate: '2026-05-27',
      },
    });
    const createTaskBody = await createTaskResponse.json();
    const deleteResponse = await request.delete(`/api/tasks/${createTaskBody.task.id}`, {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
    });
    const deleteBody = await deleteResponse.json();
    const tasksResponse = await request.get('/api/tasks?q=Delete%20weekly%20quality%20report', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
    });
    const tasksBody = await tasksResponse.json();

    expect(deleteResponse.ok()).toBeTruthy();
    expect(deleteBody.deletedTask.id).toBe(createTaskBody.task.id);
    expect(tasksBody.tasks.map((task: { id: string }) => task.id)).not.toContain(createTaskBody.task.id);
  });

  test('blocks users from deleting tasks assigned to someone else', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const adaAuth = await login(request, users.ada);
    const createTaskResponse = await request.post('/api/tasks', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
      data: {
        title: `Protected task ${Date.now()}`,
        assigneeId: users.admin.id,
        priority: 'Medium',
        dueDate: '2026-05-28',
      },
    });
    const createTaskBody = await createTaskResponse.json();

    try {
      const deleteResponse = await request.delete(`/api/tasks/${createTaskBody.task.id}`, {
        headers: {
          authorization: `Bearer ${adaAuth.token}`,
        },
      });
      const deleteBody = await deleteResponse.json();

      expect(deleteResponse.status()).toBe(403);
      expect(deleteBody.message).toBe('You can only delete tasks assigned to you.');
    } finally {
      await deleteTaskIfPresent(request, adminAuth.token, createTaskBody.task.id);
    }
  });

  test('returns not found when deleting an unknown task', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const response = await request.delete('/api/tasks/not-a-real-task', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.message).toBe('Task not found.');
  });

  test('validates required task creation fields', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const response = await request.post('/api/tasks', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
      data: {
        priority: 'High',
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.message).toBe('Title and assigneeId are required.');
  });

  test('rejects task creation for an unknown assignee', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const response = await request.post('/api/tasks', {
      headers: {
        authorization: `Bearer ${adminAuth.token}`,
      },
      data: {
        title: 'Cannot assign this task',
        assigneeId: 'missing-user',
        priority: 'Medium',
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.message).toBe('Assignee not found.');
  });

  test('paginates task API results', async ({ request }) => {
    const adminAuth = await login(request, users.admin);
    const createdTaskIds: string[] = [];

    try {
      for (let index = 0; index < 12; index += 1) {
        const createResponse = await request.post('/api/tasks', {
          headers: {
            authorization: `Bearer ${adminAuth.token}`,
          },
          data: {
            title: `API paginated task ${Date.now()} ${index}`,
            assigneeId: users.admin.id,
            priority: 'Low',
            dueDate: '2026-05-30',
          },
        });
        const createBody = await createResponse.json();
        createdTaskIds.push(createBody.task.id);
      }

      const firstPageResponse = await request.get('/api/tasks?page=1&pageSize=10', {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
      });
      const firstPageBody = await firstPageResponse.json();
      const secondPageResponse = await request.get('/api/tasks?page=2&pageSize=10', {
        headers: {
          authorization: `Bearer ${adminAuth.token}`,
        },
      });
      const secondPageBody = await secondPageResponse.json();

      expect(firstPageResponse.ok()).toBeTruthy();
      expect(firstPageBody.tasks).toHaveLength(10);
      expect(firstPageBody.total).toBeGreaterThanOrEqual(12);
      expect(firstPageBody.totalPages).toBeGreaterThanOrEqual(2);
      expect(secondPageResponse.ok()).toBeTruthy();
      expect(secondPageBody.page).toBe(2);
      expect(secondPageBody.tasks.length).toBeGreaterThan(0);
    } finally {
      await Promise.all(createdTaskIds.map(taskId => deleteTaskIfPresent(request, adminAuth.token, taskId)));
    }
  });
});
