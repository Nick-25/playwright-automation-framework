# Local Data

The application stores users and tasks in a local SQLite database at `data/app.db`.

The database is created and seeded automatically when the server starts. The database file is ignored by Git, so API-created users and tasks persist on your machine across server restarts but are not pushed to GitHub.

## Seeded Users

| Email | Password | Access |
| --- | --- | --- |
| `nick@example.com` | `nick-123` | user |
| `ada@example.com` | `lovelace-123` | user |
| `grace@example.com` | `hopper-123` | user |
| `admin@example.com` | `admin-123` | admin |

## Seeded Tasks

The server seeds starter tasks for the portfolio users. These records support dashboard metrics, task visibility, filtering, pagination, and user-scoped task behavior.

## Persistence Behavior

- `data/app.db` is created automatically if it does not exist.
- Seed inserts use stable records so repeated server starts do not duplicate the initial data.
- Manual API calls and exploratory app usage can create durable local records.
- API tests use cleanup helpers in `tests/helpers/api.ts` to remove durable users and tasks created during a run.

## Resetting Local Data

To reset local state, stop the server and delete `data/app.db`. The next server start recreates the database with seeded users and tasks.
