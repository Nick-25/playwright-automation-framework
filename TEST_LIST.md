# Test List

Generated on: 2026-09-29T18:05:19.620Z

## Summary

- **Total Tests:** 47
- **Skipped Tests:** 0
- **Active Tests:** 47
- **Test Files:** 8

## Tests by File

### accessibility.spec.ts

#### accessibility smoke

- has no WCAG violations on public entry points
- has no WCAG violations on authenticated task workflow

### api-auth.spec.ts

#### JWT API access

- creates a 4 hour JWT session cookie at login
- returns only the current user when called with a regular user token
- restores the current user from the session cookie
- returns all users when called with an admin token
- rejects user info requests without a valid token
- creates a longer-lived Postman token with the signing key
- creates a non-expiring Postman token with the signing key
- rejects dev token requests without the signing key

#### admin user management API

- allows an admin to add and delete a user
- blocks regular users from adding users
- validates duplicate users
- validates required user creation fields
- returns not found when deleting an unknown user

#### task API

- adds tasks to any user but only returns the logged-in users tasks
- marks the logged-in users task complete through the API
- deletes the logged-in users task through the API
- blocks users from deleting tasks assigned to someone else
- returns not found when deleting an unknown task
- validates required task creation fields
- rejects task creation for an unknown assignee
- paginates task API results

### dashboard.spec.ts

#### dashboard welcome page

- shows only the public welcome page with login actions when signed out
- opens the login page from the hero login button
- shows dashboard metrics after a real user signs in
- logs out and returns to the public welcome page

### form-validation.spec.ts

#### sign in

- lists the real users available in the portfolio framework
- validates fields before sending credentials
- rejects unknown credentials
- signs in a real user and persists their session

### profile.spec.ts

#### profile

- is available with a stored signed-in session
- loads the signed-in user profile from the app API
- loads a different profile for a different signed-in user

### todo-list.spec.ts

#### todo list

- shows existing tasks
- adds a new task
- ignores blank tasks
- marks a task complete
- deletes a task from the task table
- removes a completed task from the open task table
- filters the logged-in user tasks by search text and priority
- finds a specific task row by task name
- paginates the task table after 10 rows

### unauthorized.spec.ts

#### unauthorized access

- redirects signed-out users from ${path}
- returns signed-out users to the welcome page

### visual-regression.spec.ts

#### visual regression smoke

- captures the sign-in page baseline
- captures the authenticated task page baseline

