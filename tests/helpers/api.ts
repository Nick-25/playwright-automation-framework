import { expect, type APIRequestContext } from '@playwright/test';
import { users } from '../fixtures/users.js';

export type SeededUser = (typeof users)[keyof typeof users];

export async function login(request: APIRequestContext, user: SeededUser) {
  const response = await request.post('/api/login', {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function deleteTaskIfPresent(request: APIRequestContext, token: string, taskId?: string) {
  if (!taskId) return;

  await request.delete(`/api/tasks/${taskId}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
}

export async function deleteUserIfPresent(request: APIRequestContext, token: string, userId?: string) {
  if (!userId) return;

  await request.delete(`/api/users/${userId}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
}
