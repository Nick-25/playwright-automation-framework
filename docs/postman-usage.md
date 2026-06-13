# Postman Usage

The repository includes `postman_collection.json` for manual API exploration against the local application.

## Start the App

```powershell
npm install
npm run start
```

The app runs at `http://127.0.0.1:3000`.

## Import the Collection

Import `postman_collection.json` into Postman. The collection is intended for local use against the app server started from this repository.

## Get a Token

You can authenticate with `POST /api/login` by using one of the seeded users from [`docs/local-data.md`](local-data.md).

For Postman convenience, you can also create a development token:

```http
POST http://127.0.0.1:3000/api/dev-token
x-signing-key: local-postman-key
Content-Type: application/json

{
  "email": "admin@example.com",
  "expiresInHours": "never"
}
```

Use the returned token in protected requests:

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

## Notes

- Development tokens are for local portfolio exploration only.
- Non-expiring dev tokens remain valid until `JWT_SECRET` changes or the user is deleted.
- Admin-only requests require a token for `admin@example.com`.
- Endpoint details are documented in [`docs/api-reference.md`](api-reference.md).
