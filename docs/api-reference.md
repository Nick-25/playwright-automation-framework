# API Reference

The local server exposes JSON endpoints for authentication, session restoration, profile data, dashboard metrics, task management, and admin-only user management.

The application runs locally at `http://127.0.0.1:3000`.

## Authentication

Log in first. The response includes a JWT token and the browser receives a 4-hour `session_token` cookie.

```http
POST http://127.0.0.1:3000/api/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin-123"
}
```

Use the returned token for protected API calls:

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

The browser app also stores the returned auth payload in `localStorage` under `pom-practice-auth` so the front end can render signed-in state.

## Development Tokens

For local API exploration, the server can mint a token with a signing key instead of requiring a UI login. The default local key is `local-postman-key`.

```http
POST http://127.0.0.1:3000/api/dev-token
x-signing-key: local-postman-key
Content-Type: application/json

{
  "email": "admin@example.com",
  "expiresInHours": 48
}
```

`expiresInHours` is optional. Dev tokens default to 24 hours and are capped at 7 days. For local Postman testing, use `"expiresInHours": "never"` to create a non-expiring token.

Tokens remain valid after server restarts as long as `JWT_SECRET` stays the same and the token has not expired. Non-expiring dev tokens remain valid until you change `JWT_SECRET` or delete the user. The default local JWT secret is stable for this portfolio framework, but you can set your own:

```powershell
$env:JWT_SECRET="your-local-jwt-secret"
npm run start
```

## Core Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/login` | Authenticate and issue a JWT |
| `POST /api/logout` | Clear the browser session cookie |
| `GET /api/session` | Restore the current session |
| `GET /api/profile` | Return the signed-in user's profile |
| `GET /api/dashboard` | Return dashboard metrics |
| `GET /api/user-info` | Return scoped user data |
| `POST /api/users` | Create a user, admin token required |
| `DELETE /api/users/:id` | Delete a user, admin token required |
| `GET /api/tasks` | Return assigned tasks with filters and pagination |
| `POST /api/tasks` | Create a task |
| `PATCH /api/tasks/:id/complete` | Mark an authorized task complete |
| `DELETE /api/tasks/:id` | Delete an authorized task |

## Authorization Rules

- Only signed-in users can access profile, dashboard, tasks, and user-info APIs.
- Only admins can create or delete users.
- Regular users calling `GET /api/user-info` see only themselves.
- Admins calling `GET /api/user-info` see the full user list.
- A user can complete or delete only tasks assigned to them.
- Admins can complete or delete any task.
