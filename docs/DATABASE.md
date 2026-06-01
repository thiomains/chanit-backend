# Datenbank

## Verbindung

`database.js` nutzt den **MongoDB Native Driver** (nicht Mongoose). Beim ersten Zugriff wird eine Verbindung aufgebaut und das Datenbankobjekt gecacht.

```js
const { connectDatabase } = require('./database');
const db = await connectDatabase();
```

## Konfiguration

```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chanit
MONGODB_DB=chanit
```

## Collections

### `users`

Kernkontoinformationen.

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | String (Snowflake) | Eindeutige ID |
| `username` | String | Login-Name (kleingeschrieben) |
| `email` | String | Login-E-Mail |
| `password` | String | bcrypt-Hash |
| `createdAt` | Number (Timestamp) | Registrierungsdatum |
| `active` | Boolean | Konto aktiv? |
| `emailVerified` | Boolean | E-Mail bestätigt? |
| `faserId` | String | (optional) Faser-OAuth-ID |

### `profiles`

Öffentliche und private Profildaten.

| Feld | Typ | Beschreibung |
|---|---|---|
| `userId` | String | Verweis auf `users.id` |
| `username` | String | Anzeigename |
| `profilePictureUrl` | String | URL zum Avatar-Bild |
| `bio` | String | Profilbeschreibung (default `""`) |
| `createdAt` | Number (Timestamp) | Erstellungszeitpunkt |

### `sessions`

Serverseitige Sessions für Token-Refresh und WebSocket-Auth.

| Feld | Typ | Beschreibung |
|---|---|---|
| `sessionId` | String | Session-Identifier (Snowflake) |
| `userId` | String | Verweis auf `users.id` |
| `refreshToken` | String | bcrypt-Hash des Refresh-Tokens |
| `accessToken` | String | bcrypt-Hash des Access-Tokens |
| `accessTokenExpiresAt` | Number (Timestamp) | Ablauf des Access-Tokens (15 Minuten) |
| `expiresAt` | Number (Timestamp) | Ablauf der Session (7 Tage) |
| `createdAt` | Number (Timestamp) | Erstellungszeitpunkt |
| `lastUsed` | Number (Timestamp) | Letzte Nutzung |
| `active` | Boolean | Session aktiv? |
| `deviceIdentifier` | String | User-Agent |
| `ipAddress` | String | IP-Adresse |

### `channels`

Chat-Channels (Gruppen oder DMs).

| Feld | Typ | Beschreibung |
|---|---|---|
| `channelId` | String | Snowflake-ID |
| `channelType` | String | `direct-message` |
| `directMessageChannel` | Object | `{ members: [...], createdAt }` |
| `lastMessage` | Object | Letzte Nachricht |
| `lastMessageCreatedAt` | Number (Timestamp) | Zeitpunkt der letzten Nachricht |
| `createdAt` | Number (Timestamp) | Erstellungszeitpunkt |

### `messages`

Chat-Nachrichten.

| Feld | Typ | Beschreibung |
|---|---|---|
| `messageId` | String | Snowflake-ID |
| `channelId` | String | Verweis auf `channels.channelId` |
| `createdAt` | Number (Timestamp) | Sendezeitpunkt |
| `author` | String | Verweis auf `users.id` |
| `body` | String | Nachrichtentext |
| `attachments` | Array | `{ url, mimetype, attachmentId, fileName, fileSize }` |
| `active` | Boolean | Nachricht aktiv (nicht gelöscht)? |
| `embeds` | Array | Rich-Embeds (max. 5) |
| `lastEdited` | Number (Timestamp) | (optional) Bearbeitungszeitpunkt |

### `friendRequests`

Ausstehende Freundschaftsanfragen.

| Feld | Typ | Beschreibung |
|---|---|---|
| `sender` | String | Absender (`users.id`) |
| `recipient` | String | Empfänger (`users.id`) |
| `createdAt` | Number (Timestamp) | Zeitpunkt |

### `friends`

Bestätigte Freundschaften.

| Feld | Typ | Beschreibung |
|---|---|---|
| `users` | Array [String, String] | Beide Partner-IDs |
| `friendsSince` | Number (Timestamp) | Bestätigungszeitpunkt |
| `directChannelId` | String | ID des DM-Channels |

### `notifications`

In-App-Benachrichtigungen.

| Feld | Typ | Beschreibung |
|---|---|---|
| `userId` | String | Empfänger |
| `notificationId` | String | Snowflake-ID |
| `type` | String | Kategorie (z. B. `message`) |
| `content` | Object | Typ-spezifische Daten |
| `dismissed` | Boolean | Bereits geschlossen? |
| `createdAt` | Number (Timestamp) | Zeitpunkt |

### `verificationCodes`

Temporäre E-Mail-Codes.

| Feld | Typ | Beschreibung |
|---|---|---|
| `emailAddress` | String | E-Mail-Adresse |
| `code` | String | Einmalcode |
| `expiresAt` | Number (Timestamp) | Ablaufzeit |
| `used` | Boolean | Bereits eingelöst? |

## ID-Generierung

Alle primären Schlüssel werden über `snowflake.js` erzeugt — eine Discord-Snowflake-ähnliche Implementierung:

- 41 Bit: Zeitstempel (ms seit Epoche)
- 10 Bit: Maschinen-ID (hier immer `0`)
- 12 Bit: Sequenz pro Millisekunde

Dadurch sind IDs sortierbar nach Erstellungszeitpunkt, ohne auf MongoDBs `ObjectId` angewiesen zu sein.
