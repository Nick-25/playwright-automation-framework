# Playwright POM Practice App

A small practice project for learning Playwright the way many teams use it:
standard Playwright Test, a real local app, and Page Object Model classes.

## What is included

- A tiny Node server in `server.js`
- A static sample app in `app/`
- Playwright config with `webServer`, `baseURL`, and desktop browser projects
- Page objects in `tests/pages/`
- Example specs for tasks, sign-in validation, and profile API loading

## Commands

```powershell
npm install
npx playwright install
npm run start
npm test
```

The app runs at `http://127.0.0.1:3000`.

Playwright starts the app automatically when you run `npm test`, so you only
need `npm run start` when you want to click around manually.

## Useful Playwright Scripts

```powershell
npm run test:headed
npm run test:ui
npm run test:debug
npm run report
```
