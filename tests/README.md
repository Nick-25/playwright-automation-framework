# Playwright Test Framework Notes

This project uses Playwright's standard test runner, not a custom BDD layer.
The tests run against the local application in `app/`, which is started automatically
by Playwright through the `webServer` setting in `playwright.config.ts`.

Common commands:

- `npm test` runs all tests headlessly.
- `npm run test:a11y` runs the axe accessibility smoke tests.
- `npm run test:visual` runs the Chromium visual regression smoke tests.
- `npm run test:headed` opens real browser windows while tests run.
- `npm run test:ui` launches Playwright's interactive UI mode.
- `npm run test:debug` opens the debugger for step-by-step inspection.
- `npm run report` opens the most recent HTML report.
- `npm run start` starts the local application manually at `http://127.0.0.1:3000`.

The framework uses Page Object Model classes in `tests/pages/`. The spec files
describe user behavior, while page objects own locators and common actions.

Accessibility smoke coverage lives in `tests/accessibility.spec.ts` and uses
`@axe-core/playwright` against public and authenticated pages.

Visual regression smoke coverage lives in `tests/visual-regression.spec.ts`.
Update baselines only for intentional UI changes.
