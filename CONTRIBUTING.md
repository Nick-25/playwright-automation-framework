# Contributing

Thanks for taking a look at this portfolio framework. Changes should go through pull requests instead of direct pushes to `master`.

## Setup

Prerequisites:

- Node.js 20.19.0 or compatible
- npm
- Git
- Playwright browser dependencies

Clone the repository and move into the project directory:

```powershell
git clone https://github.com/Nick-25/playwright-automation-framework.git
cd playwright-automation-framework
```

## Installation

Install Node dependencies:

```powershell
nvm use
npm install
```

Install Playwright browsers:

```powershell
npx playwright install
```

The local SQLite database is created automatically when the server starts. Runtime files such as `data/*.db`, `test-results/`, `playwright-report/`, and `ctrf/` should not be committed.

## Running Tests

Run the full Playwright suite:

```powershell
npm test
```

Run useful local variants:

```powershell
npm run test:headed
npm run test:a11y
npm run test:visual
npm run test:ui
npm run test:debug
```

The visual regression suite uses Chromium baselines. Update snapshots only when a visual change is intentional:

```powershell
npx playwright test tests/visual-regression.spec.ts --project=chromium --update-snapshots
```

Playwright starts the local app through the `webServer` setting in `playwright.config.ts`. Start the app manually only when you want to inspect it in a browser:

```powershell
npm run start
```

The app runs at `http://127.0.0.1:3000`.

## Viewing Reports

Open the most recent Playwright HTML report:

```powershell
npm run report
```

Generated report locations:

- `playwright-report/` for the Playwright HTML report
- `test-results/` for traces and attachments
- `ctrf/ctrf-report.json` for standardized test reporting

GitHub Actions also uploads these artifacts and publishes a CTRF summary when the workflow runs.

## Docker

Build and run the framework in Docker:

```powershell
docker build -t playwright-automation-framework .
docker run --rm playwright-automation-framework
```

Or use Docker Compose:

```powershell
docker compose up --build
```

## Pull Request Workflow

1. Create a branch from `master`.
2. Keep changes focused and easy to review.
3. Update documentation when behavior, commands, reports, or workflows change.
4. Run relevant tests before opening a PR.
5. Include a short PR summary, test evidence, and any known limitations.
6. Wait for GitHub Actions to finish.
7. Address review feedback with follow-up commits.

## CI Requirements

The Playwright workflow must pass before a PR is merged. It builds the app, runs the browser/API tests, uploads artifacts, and publishes the CTRF test report in GitHub Actions.

## Ownership

Repository ownership is documented in `.github/CODEOWNERS`. Once branch protection is enabled, PRs that touch this repo can require owner review before merge.
