# Architecture Documentation

This document explains how the Playwright Automation Framework Portfolio is organized for maintainability, CI execution, and consulting-style demonstration.

## Application Layer

The application under test is intentionally compact but behaves like a real internal workflow tool.

- `server.js` serves static assets, exposes JSON API endpoints, manages authentication, and reads/writes SQLite data.
- `app/` contains the browser-facing HTML, CSS, and JavaScript.
- `data/app.db` is created locally at runtime and seeded with stable users and tasks.
- Authentication uses JWTs, an HTTP-only session cookie, and client-side session state for rendering.

This gives the automation suite meaningful behavior to validate: sign-in, protected pages, dashboard metrics, profile loading, task creation, task completion, task deletion, filtering, pagination, and role-based API access.

## Page Objects

Page Object Model classes live in `tests/pages/`.

- Page objects own locators, navigation helpers, and reusable user actions.
- Specs call behavior-focused methods instead of duplicating selectors.
- Page objects keep UI mechanics centralized, which reduces maintenance when markup or workflows change.

The current page object layer includes dashboard, sign-in, profile, and task-page abstractions.

## Tests

Test specifications live directly under `tests/`.

- Browser tests validate end-to-end workflows through real pages.
- API tests validate authentication, authorization, user management, task workflows, pagination, and negative paths.
- Accessibility smoke tests use `@axe-core/playwright` to scan public and authenticated pages for WCAG A/AA violations.
- Visual regression smoke tests use Playwright screenshot assertions for stable Chromium baselines.
- Tests are organized around behavior areas rather than implementation files.
- Cross-browser projects run the same suite in Chromium and Firefox.

This layered strategy avoids overloading browser tests with checks that are faster and clearer at the API layer.

## Fixtures

Shared fixtures live in `tests/fixtures/`.

- `tests/fixtures/pages.ts` wires page object instances into Playwright tests.
- `tests/fixtures/users.ts` mirrors the seeded users used by the local application.

Fixtures keep test setup predictable and make specs easier to scan.

## Utilities

Reusable helpers live in `tests/helpers/`.

- Authentication helpers can establish a stored session without repeating UI login in every test.
- API helpers centralize login and cleanup for users/tasks created during test execution.
- Shared helpers reduce repeated setup code while keeping test intent visible.

The framework uses utilities sparingly so the suite remains explicit and easy for new maintainers to understand.

## CI/CD

The GitHub Actions workflow in `.github/workflows/playwright.yml` is split into build, test, and report publishing jobs.

- The build job installs dependencies and runs the project build command if one exists.
- The test job installs Playwright browsers, runs the suite, and uploads Playwright/CTRF artifacts.
- The report job downloads artifacts and publishes a CTRF summary into GitHub Actions.

The CI design is meant to support fast feedback, consistent artifacts, and clear failure triage.

Docker support provides an additional path for consistent local or CI-like execution with Playwright's official browser image.

## Reporting

The framework produces multiple report formats for different audiences.

- Playwright HTML report for trace-driven debugging.
- `test-results/` artifacts for screenshots, traces, videos, and attachments when generated.
- `ctrf/ctrf-report.json` for standardized machine-readable results.
- GitHub Actions summary output for delivery and review visibility.

## Maintainability Principles

- Keep selectors and UI actions in page objects.
- Keep assertions behavior-focused in specs.
- Prefer API setup when browser setup would obscure test intent.
- Clean up durable records created during API tests.
- Keep CI artifacts predictable so failures can be reviewed without rerunning locally.
