# Architektur

## Einstiegspunkt

`yoghurt-chat-backend.js` initialisiert den Express-Server, bindet globale Middleware (CORS, JSON-Parser, Cookie-Parser) und registriert alle Routen und WebSocket-Handler.

## Schichten

```
┌─────────────────────────────────────┐
│  Client (Web / Mobile)              │
└──────────┬──────────────────────────┘
           │ HTTP / WebSocket
┌──────────▼──────────────────────────┐
│  Express Router                     │
│  ├── Rate Limit (selected routes)   │
│  ├── CORS + Cookie Parser           │
│  └── authMiddleware (selected)      │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│  Endpoint-Handler                   │
│  (endpoints/<domain>/<route>.js)    │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│  Domain-Module (Root-Ebene)       │
│  (users.js, messages.js, …)       │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│  database.js                        │
│  (MongoDB Native Driver)            │
└─────────────────────────────────────┘
```

## Domain-Module (Root-Dateien)

| Datei | Aufgabe |
|---|---|
| `database.js` | MongoDB-Verbindung und Client-Export |
| `users.js` | CRUD-Logik für Benutzerkonten |
| `messages.js` | Nachrichtenpersistenz und Channel-History |
| `channels.js` | Channel-Metadaten und Teilnehmer |
| `currentChannel.js` | Aktive Channel-Zustände (z. B. für WebSocket-Scope) |
| `friends.js` | Freundschaftsbeziehungen und Anfragen |
| `profiles.js` | Erweiterte Profildaten (Avatar, Bio, etc.) |
| `sessions.js` | Serverseitige Session-Verwaltung |
| `notifications.js` | In-App-Benachrichtigungen |
| `verificationCodes.js` | Temporäre E-Mail-Codes |
| `authMiddleware.js` | Token- und Session-Validierung |
| `globalPermissions.js` | Rollen- und Rechtedefinitionen |
| `globalPermissionsMiddleware.js` | Admin- und Rollenprüfung |
| `events.js` | WebSocket-Event-Handler (`/events`) |
| `fileUpload.js` | Multer-Instanz mit Memory-Storage (für Upload-Middleware) |
| `mailSender.js` | Nodemailer-Wrapper |
| `snowflake.js` | ID-Generierung (Discord-Snowflake-ähnlich) |

## Endpoints

Die Routen sind unter `endpoints/` nach Domain gruppiert und spiegeln die URL-Struktur wider:

```
endpoints/
├── auth/
│   ├── register.js
│   ├── login.js
│   ├── logout.js
│   ├── me.js
│   ├── faser.js
│   ├── session/refresh.js
│   └── verification-code.js
├── user/
│   ├── publicUser.js
│   ├── profile.js
│   ├── friends.js
│   ├── friends/requests.js
│   └── recent.js
├── channel/
│   ├── channel.js
│   └── messages.js
├── message/
│   ├── attachments.js
│   ├── delete.js
│   └── patch.js
├── notifications/
│   └── notifications.js
├── settings/
│   ├── data/request.js
│   └── profile/
│       ├── avatar.js
│       └── profileUpdate.js
└── admin/
    ├── me.js
    └── users.js
```

## WebSocket

Der Pfad `/events` wird von `express-ws` bereitgestellt. Der Handler in `events.js` verwaltet:

- Neue Verbindungen
- Broadcasts an Channel-Teilnehmer
- Status-Updates (Online/Away/Offline)

## Datenbankschema (konzeptionell)

| Collection | Schlüsselfelder |
|---|---|
| `users` | `id`, `username`, `email`, `password`, `createdAt`, `active`, `emailVerified` |
| `profiles` | `userId`, `username`, `profilePictureUrl`, `bio`, `createdAt` |
| `sessions` | `sessionId`, `userId`, `refreshToken`, `accessToken`, `expiresAt`, `active` |
| `channels` | `channelId`, `channelType`, `directMessageChannel`, `lastMessage`, `createdAt` |
| `messages` | `messageId`, `channelId`, `author`, `body`, `attachments`, `embeds`, `active`, `createdAt` |
| `friendRequests` | `sender`, `recipient`, `createdAt` |
| `friends` | `users`, `friendsSince`, `directChannelId` |
| `notifications` | `notificationId`, `userId`, `type`, `content`, `dismissed`, `createdAt` |
| `verificationCodes` | `emailAddress`, `code`, `expiresAt`, `used` |
