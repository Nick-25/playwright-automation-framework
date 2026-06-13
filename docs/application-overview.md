# Playwright Automation Framework Portfolio: Application and Test Overview

## Purpose

This project is a compact full-stack Playwright automation framework built to demonstrate realistic senior QA engineering patterns. It combines a local Node.js server, a static front end, SQLite persistence, browser automation, API testing, and GitHub Actions reporting.

The application is intentionally focused from a product point of view, but it includes enough real behavior to demonstrate how a production-style framework is structured, validated, and reported.

## High-Level Architecture

The application has four main parts:

1. A local HTTP server in `server.js`
2. Static HTML, CSS, and client-side JavaScript in `app/`
3. A local SQLite database in `data/app.db`
4. A Playwright test suite in `tests/`

At runtime, the browser loads static pages from `app/`, and those pages call JSON API endpoints exposed by `server.js`. The server reads and writes user and task data in SQLite.

## What the Application Does

The app behaves like a lightweight internal testing portal. It supports:

- Sign-in with seeded users
- Session restoration from an HTTP-only cookie
- Protected pages for profile and task management
- A dashboard with task-based metrics
- A task list with creation, filtering, completion, deletion, and pagination
- Admin-only user management through the API
- Development token generation for tools like Postman

## Seeded Data

When the server starts, it creates the SQLite database if it does not exist and seeds a small set of users and tasks.

### Seeded users

- `ada@example.com` / `lovelace-123`
- `grace@example.com` / `hopper-123`
- `nick@example.com` / `nick-123`
- `admin@example.com` / `admin-123`

The first three are normal users. `admin@example.com` is an admin user and can create or delete other users through the API.

### Seeded tasks

The app also seeds a few starter tasks assigned to the seeded users. These are used by both the UI and tests to verify dashboard metrics, filtering, and task visibility.

## Authentication and Session Model

Authentication is JWT-based, but the app uses it in two ways:

- The browser receives an HTTP-only `session_token` cookie after login.
- The client stores the returned auth payload in `localStorage` under `pom-practice-auth`.

This gives the front end enough information to render signed-in UI state while still allowing the server to verify the actual token.

### Session behavior

- `POST /api/login` validates credentials and issues a 4-hour JWT
- `POST /api/logout` clears the cookie
- `GET /api/session` restores the session when a valid cookie exists
- The client hydrates auth state on load and redirects signed-out users away from protected pages

Protected pages are `/profile` and `/todos`. If the client sees that no auth token is available for those paths, it redirects the browser to `/unauthorized`.

## Front-End Pages and User Flows

### Welcome and dashboard page

Route: `/`

This page has two states:

- Signed out: shows a public welcome view and log-in actions
- Signed in: shows an authenticated shell and dashboard controls

After sign-in, the dashboard area can load:

- Open task count
- Blocked task count
- High-priority task count
- Recent activity items

These values come from `GET /api/dashboard`.

### Sign-in page

Route: `/sign-in`

This page provides:

- Client-side validation for email format and password length
- Inline error messaging
- Real sign-in against `POST /api/login`
- A sample-user list loaded from `GET /api/users`

The sample-user endpoint is intentionally limited to the three non-admin seeded users so the sign-in screen provides stable framework data rather than a full directory listing.

### Profile page

Route: `/profile`

This page supports two related behaviors:

- Loading the signed-in user profile from `GET /api/profile`
- Saving lightweight local UI preferences to `localStorage`

The saved profile settings are front-end only. They are not written back to SQLite. The persisted settings include:

- Display name
- Preferred team
- Email update preference

This separation is useful for testing because it demonstrates both API-backed data and browser-local state.

### Tasks page

Route: `/todos`

This is the richest UI in the project. It allows a signed-in user to:

- Create a new task
- Choose an assignee
- Set priority
- Set a due date
- Search tasks by text
- Filter tasks by status
- Filter tasks by priority
- Mark tasks complete
- Delete tasks
- Navigate paginated results

Task loading is user-scoped. The server only returns tasks assigned to the logged-in user, even if that user creates tasks for someone else.

### Unauthorized page

Route: `/unauthorized`

This is the fallback page for direct navigation to protected routes without a valid session.

## Data Model

The database contains two tables:

### `users`

Fields:

- `id`
- `email`
- `password`
- `name`
- `role`
- `team`
- `access`

`access` is restricted to `user` or `admin`.

### `tasks`

Fields:

- `id`
- `title`
- `assignee_id`
- `priority`
- `status`
- `due_date`

Task priority is limited to `High`, `Medium`, or `Low`. Task status is limited to `Open`, `In progress`, `Blocked`, or `Done`.

## API Surface

The server exposes a compact but useful API set.

### Public or session-establishing endpoints

- `GET /api/users`
- `POST /api/login`
- `POST /api/logout`
- `POST /api/dev-token`
- `GET /api/session`

### Signed-in user endpoints

- `GET /api/profile`
- `GET /api/dashboard`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/complete`
- `DELETE /api/tasks/:id`
- `GET /api/user-info`

### Admin-only endpoints

- `POST /api/users`
- `DELETE /api/users/:id`

## Authorization Rules

The app includes several useful authorization boundaries:

- Only signed-in users can access profile, dashboard, tasks, and user-info APIs
- Only admins can create or delete users
- Regular users calling `GET /api/user-info` see only themselves
- Admins calling `GET /api/user-info` see the full user list
- A user can complete only tasks assigned to them
- A user can delete only tasks assigned to them
- Admins can complete any task
- Admins can delete any task

These rules make the project a useful target for both happy-path and negative-path automation.

## Persistence Behavior

SQLite data is local and persistent by design.

- The database is stored at `data/app.db`
- It is created automatically if missing
- Seed inserts use `INSERT OR IGNORE`
- Data created by tests or manual use remains on disk unless it is explicitly deleted

This means the suite has to be deliberate about cleanup when a test creates durable records. That is why temporary user creation tests now remove their created users at the end of execution.

## Test Strategy Overview

The test suite is designed to validate the app at multiple layers rather than relying on only browser clicks.

It includes:

- End-to-end browser tests
- Direct API tests
- Cross-browser execution
- Page Object Model abstraction
- CI reporting through Playwright HTML output and CTRF JSON

At the time of writing, the suite contains 48 declared test cases per Playwright project. Because the config defines both Chromium and Firefox projects, Playwright lists 96 project/test combinations for a full suite inventory.

## How the Tests Are Structured

### Playwright configuration

The suite uses Playwright Test with:

- `testDir: ./tests`
- `fullyParallel: true`
- A `webServer` that starts `node server.js`
- `baseURL: http://127.0.0.1:3000`
- Reporters for HTML, list output, and CTRF JSON
- Two desktop browser projects: Chromium and Firefox

This means `npm test` automatically boots the application, runs the suite, and produces machine-readable and human-readable reports.

### Page Object Model design

The browser suite uses Page Object Model classes in `tests/pages/`:

- `SignInPage`
- `DashboardPage`
- `ProfilePage`
- `TodoPage`

The custom fixtures in `tests/fixtures/pages.ts` instantiate these objects and make them available to tests. This keeps specs focused on behavior while selectors and page mechanics stay centralized in reusable classes.

### Shared seeded users

`tests/fixtures/users.ts` mirrors the seeded database users. The tests rely on those stable records to log in as predictable personas and assert role-based behavior.

### Session helper

`tests/helpers/auth.ts` includes a helper that signs in through the API and seeds `localStorage` before page load. This allows some tests to start from an authenticated state without repeating full UI login every time.

## What the Browser Tests Cover

### Dashboard tests

The dashboard spec verifies:

- The signed-out welcome state
- Log-in link behavior from the hero area
- Authenticated navigation and banner state
- Dashboard metric loading after sign-in
- Logout returning the app to the public state

How it is tested:

- The tests use real navigation and real sign-in
- The page object asserts visibility and text of authenticated and unauthenticated UI regions
- One test also calls `GET /api/dashboard` directly through Playwright's request API and compares UI metric values to the server response

That last detail is important because it validates that the UI is rendering actual API data rather than only checking static text.

### Sign-in and validation tests

The form-validation spec verifies:

- The sample-user list displayed on the sign-in page
- Client-side email and password validation
- Error handling for unknown credentials
- Successful sign-in and stored auth persistence

How it is tested:

- Invalid credentials are entered through the browser form
- The tests assert inline validation messages and `aria-invalid` attributes
- For successful sign-in, the test inspects `localStorage` and confirms the saved auth object contains the expected email and a three-part JWT

This demonstrates both UI validation and session persistence checks.

### Profile tests

The profile spec verifies:

- Access with a stored signed-in session
- Loading the signed-in user's profile from the API
- Correct profile switching when a different user signs in

How it is tested:

- One test bypasses the login UI by using the stored-session helper
- Other tests sign in normally, navigate to `/profile`, trigger profile loading, and assert the rendered profile details
- Assertions cover name, email, role, and team values

### Unauthorized access tests

The unauthorized spec verifies:

- Redirects from `/profile` when signed out
- Redirects from `/todos` when signed out
- Navigation back from the unauthorized page to the welcome page

How it is tested:

- The browser directly opens protected URLs without a session
- The tests assert the redirect target, the unauthorized content, and the recovery link back to `/`

This gives coverage for the client-side route-guard logic.

### Task page tests

The todo-list spec verifies:

- Existing seeded tasks appear for the signed-in user
- A new task can be added
- Blank tasks are ignored
- A task can be marked complete
- A task can be deleted
- Completed tasks disappear when filtering for open tasks
- Search and priority filters work together
- A specific row can be identified and asserted column by column
- Pagination works when more than 10 tasks exist

How it is tested:

- Tests start from an authenticated session created by the helper
- The page object provides task-specific actions like `addTask`, `completeTask`, `searchFor`, and filter operations
- The delete flow is exercised through the same page object layer so the spec validates the button wiring and the API-backed table refresh
- Assertions inspect table rows, summaries, page summaries, and button states
- Time-based unique names such as `Date.now()` are used when a test creates new tasks so records can be uniquely found in the UI

These tests exercise both the front-end table behavior and the server's task APIs indirectly through real browser actions.

## What the API Tests Cover

The API suite in `tests/api-auth.spec.ts` validates server behavior directly through Playwright's `request` fixture.

### JWT and session coverage

These tests verify:

- Login returns a JWT and sets a 4-hour session cookie
- A regular user sees only their own data from `GET /api/user-info`
- The session can be restored from the cookie through `GET /api/session`
- An admin sees all users from `GET /api/user-info`
- Missing or invalid auth is rejected
- Dev-token generation works with the correct signing key
- Non-expiring dev tokens can be created
- Missing signing keys are rejected

How it is tested:

- Requests are sent directly to the live local server
- Responses are parsed as JSON and checked for status codes, token shape, expiration values, and returned user data
- Authorization headers are built from tokens returned during the test

### Admin user management coverage

These tests verify:

- An admin can create a user and then delete that user
- A regular user cannot create a user
- Duplicate email creation is rejected
- Deleting an unknown user returns 404

How it is tested:

- The tests log in as either an admin or a normal user
- They call `POST /api/users` and `DELETE /api/users/:id`
- Assertions check both authorization boundaries and data correctness

### Task API coverage

These tests verify:

- A task can be created for another user
- The creating admin does not see that task in their own task list
- The assigned user does see that task
- A user can mark their own task complete
- A user can delete their own task
- A user cannot delete another user's task
- Deleting an unknown task returns 404
- Task listing supports pagination

How it is tested:

- The suite creates users and tasks through direct API calls
- It then logs in as different users to prove task visibility is scoped by assignee
- Completion is verified through `PATCH /api/tasks/:id/complete`
- Pagination is verified by creating more than one page of tasks and checking returned page sizes

The temporary `task-owner` user created by the task-visibility test is now deleted in test cleanup so those records do not accumulate in `data/app.db`.

## How the Suite Executes

### Local execution

Common commands:

```powershell
npm install
npx playwright install
npm test
```

Helpful variants:

```powershell
npm run test:headed
npm run test:ui
npm run test:debug
npm run report
```

### Runtime mechanics

When `npm test` runs:

1. Playwright starts the local server through the `webServer` config
2. The app becomes available at `http://127.0.0.1:3000`
3. Tests run in parallel
4. The suite executes once per configured project
5. Reports are written after execution

Because `reuseExistingServer` is enabled outside CI, local runs can attach to an already-running server instead of launching a second one.

## Reporting and CI

The GitHub Actions workflow has three jobs:

1. `Build App`
2. `Run Playwright Tests`
3. `Publish Test Report`

Artifacts and reports produced:

- `playwright-report/` for the Playwright HTML report
- `test-results/` for traces and attachments
- `ctrf/ctrf-report.json` for standardized test reporting

The workflow publishes CTRF results into the GitHub Actions summary using `ctrf-io/github-test-reporter`, which makes pass/fail, flaky, skipped, and detailed test information easy to review in CI.

## Why This Project Is Useful as an Automation Portfolio Framework

This application is a strong portfolio framework because it combines several testing concerns in one focused codebase:

- UI workflows with real route changes and protected pages
- Client-side validation and accessibility-style error states
- Auth cookies, JWTs, and stored browser session data
- Role-based authorization rules
- API tests alongside browser tests
- Persistent local test data
- Page Object Model design
- CI reporting artifacts

In other words, it is not just a static showcase. It is a compact end-to-end automation environment built to demonstrate how behavior, data, security boundaries, and test structure fit together.
