# AGENTS.md — Chanit Backend

## Quick reference

- **Runtime:** Node.js, **CommonJS only** (`require`/`module.exports`). No ESM.
- **Framework:** Express **5** with `express-ws`.
- **Database:** MongoDB **native driver** (not Mongoose). Connect via `database.connectDatabase()`.
- **IDs:** All primary keys are Snowflake-style strings from `snowflake.generateId()`, not ObjectId.
- **No build step, no TypeScript, no linter, no test framework.**
- **Start:** `node yoghurt-chat-backend.js` (needs `.env` — see below).
- **Docs:** `docs/` contains authoritative API, auth, architecture, DB schema, deployment, and WebSocket documentation. Read them before working on a domain.

## Environment (.env)

Required. Copy `docs/DEPLOYMENT.md` for the full variable list. Key vars:

```
MONGODB_URL=...
MONGODB_DB=chanit
PORT=3000
S3_SERVER=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_ATTACHMENTS_BUCKET=...
S3_AVATARS_BUCKET=...
MAIL_SERVER=...
MAIL_SERVER_PORT=465
MAIL_USERNAME=...
MAIL_PASSWORD=...
FASER_CLIENT_ID=...
FASER_CLIENT_SECRET=...
```

`.env` is gitignored; `.env.example` is explicitly not ignored.

## Architecture

```
yoghurt-chat-backend.js   ← entrypoint, route registration, middleware wiring
├── endpoints/<domain>/   ← HTTP handlers (parse request, call domain module, send response)
│   ├── auth/             ← register, login, logout, faser OAuth, session refresh, verification
│   ├── user/             ← public profiles, friends, recent DMs
│   ├── channel/          ← channel metadata, message lists
│   ├── message/          ← attachments, delete, patch
│   ├── settings/         ← profile update, avatar, GDPR data export
│   ├── notifications/    ← notification list/dismiss
│   └── admin/            ← user list, admin permissions
└── *.js (root)           ← domain modules (DB logic), middleware, utilities
```

Domain modules at root level encapsulate DB access. Endpoint handlers should NOT contain raw DB queries — delegate to domain modules.

## Auth (critical — easy to get wrong)

**This is a custom session system, not JWT.** Tokens are random `base64url` strings, bcrypt-hashed server-side.

### REST endpoints (protected)

Two headers **both required** on every authenticated request:

```
Authorization: Bearer <accessToken>
session: <sessionId>
```

Missing either → 401. The `session` value is a **header**, not a cookie. The cookie is only used for `/api/auth/*` routes.

### WebSocket (`/events`)

WebSocket handshake cannot send custom headers. Auth via **query parameters**:

```
ws://host/events?token=<accessToken>&session=<sessionId>
```

Auth is re-validated on every WebSocket connection via `sessions.validateAccess()`.

### Email verification gate

`authMiddleware` blocks all endpoints (403) if the user's email is not verified — **except** `/api/auth/verification-code`. Keep this in mind when adding new routes under protected prefixes.

### Token lifetimes

| Token | Lifetime |
|-------|----------|
| Access token | 15 minutes |
| Refresh token / session | 7 days |

### Session cookie

Set via `sessions.setSessionCookieAndSend()`. Has path `/api/auth/` only — it won't be sent to other endpoints. HTTP-only, SameSite=strict.

## Middleware chain

1. `authMiddleware` — validates Bearer token + session ID, attaches `req.auth = { user, session }`. Applied via `app.use('/api/<prefix>/', authMiddleware)`.
2. `globalPermissionsMiddleware([...perms])` — checks admin permissions. Applied per-route (not per-prefix). Must come AFTER `authMiddleware`.

## Adding a new endpoint

1. Create handler in `endpoints/<domain>/<name>.js`.
2. Export as `module.exports = handler` or `module.exports = { get, post }`.
3. Register route in `yoghurt-chat-backend.js`.
4. Apply `authMiddleware` if needed (usually yes — see existing `app.use` lines).
5. Document in `docs/API.md`.

**Handler pattern** (follow this exactly):

```js
const domainModule = require("../../domainModule")

async function handler(req, res) {
    // validation ...
    if (bad) {
        res.status(400).send({ error: "message" })
        return
    }
    // DB call via domain module ...
    res.status(200).send(data)
}

module.exports = handler
```

Errors always: `{ error: "message" }`. Always `return` after `res.send()`.

## Database patterns

```js
const { connectDatabase } = require('./database');
const database = await connectDatabase();
const collection = database.collection("collectionName");
```

- Use `connectDatabase()` (cached connection).
- No Mongoose models. Direct `findOne`, `find`, `insertOne`, `updateOne`, etc.
- New IDs: `snowflake.generateId()` → returns a string.
- Timestamps: `Date.now()` (milliseconds), not `new Date()`.

## WebSocket events

`events.js` manages all WebSocket connections. Key exports:
- `ws(ws, req)` — connection handler (registered in entrypoint as `app.ws("/events", ...)`)
- `sendMessage(userId, message)` — send to all connections of a user
- Uses `currentChannel.js` to track which channel each socket is viewing
- Multi-device: one `Set` of sockets per userId. Online status only flips to `offline` when the last socket closes.
- 10-second ping interval per connection.

## File uploads

- `fileUpload.js` exports a Multer instance with **memory storage** (files buffered in RAM, then uploaded to S3).
- S3 uses `aws-sdk` v2. CDN URL is hardcoded as `https://cdn.faser.app/chanit/` in endpoint handlers.
- `sharp` resizes avatars to 320×320.

## Email

- `mailSender.js` is a Nodemailer wrapper. From address is hardcoded to `chanit-noreply@thimocolditz.de`.

## Rate limiting

- Only applied to `POST /api/auth/verification-code/`: 1 request per 2 minutes per IP.
- Uses `express-rate-limit`.

## CORS

Allowed origins: `https://chanit.app`, `http://localhost:3000`. Credentials enabled. `trust proxy` is set.

## No-go

- No `import` / ESM — CommonJS only.
- No Mongoose — native MongoDB driver only.
- No `.env` commits — it's gitignored.
- No `ObjectId` — use Snowflake string IDs.
- Don't skip the `emailVerified` check in middleware unless explicitly needed.
- Don't use cookies for auth on non-`/api/auth/` routes — use the `session` header.
