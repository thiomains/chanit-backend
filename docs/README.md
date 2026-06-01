# Chanit Backend

Backend für [Chanit](https://chanit.app) — eine Echtzeit-Chat-Anwendung mit Channels, Freundschaften, Benachrichtigungen und Verwaltungsfunktionen.

## Tech-Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js mit `express-ws` für WebSockets
- **Datenbank:** MongoDB (Native Driver)
- **Datei-Uploads:** AWS S3 über `aws-sdk` v2
- **E-Mail:** Nodemailer
- **Bildverarbeitung:** sharp
- **Sicherheit:** bcrypt, express-rate-limit, cookie-parser, cors

## Projektstruktur

```
.
├── docs/                    # Dokumentation
├── endpoints/               # API-Endpunkte nach Domain gruppiert
│   ├── auth/                # Registrierung, Login, Session, Verification
│   ├── user/                # Öffentliche Profile, Freunde, Recent
│   ├── channel/             # Channel-Daten und Nachrichtenverlauf
│   ├── message/             # Nachrichten (Attachments, Delete, Patch)
│   ├── notifications/       # Benachrichtigungen
│   ├── settings/            # Profil-Update, Avatar, Datenanfrage
│   └── admin/               # Admin-Endpoints
├── *.js                     # Domain-Module und Middleware (Root-Ebene)
└── yoghurt-chat-backend.js  # Server-Einstiegspunkt
```

## Schnellstart

### Voraussetzungen

- Node.js (aktuelle LTS empfohlen)
- MongoDB-Instanz (lokal oder Atlas)
- AWS S3 Bucket (für Attachments)
- SMTP-Server (für Verifikations-E-Mails)

### Installation

```bash
npm install
```

### Umgebungsvariablen

Eine `.env`-Datei im Projektroot mit folgenden Variablen ist erforderlich:

```env
# MongoDB
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/chanit
MONGODB_DB=chanit

# S3-kompatibler Storage
S3_SERVER=https://s3.eu-central-1.amazonaws.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_ATTACHMENTS_BUCKET=chanit-attachments
S3_AVATARS_BUCKET=chanit-avatars

# E-Mail (SMTP)
MAIL_SERVER=mail.chanit.app
MAIL_SERVER_PORT=465
MAIL_USERNAME=chanit-noreply@thimocolditz.de
MAIL_PASSWORD=...

# OAuth (Faser)
FASER_CLIENT_ID=...
FASER_CLIENT_SECRET=...

# App
PORT=3000
```

### Start

```bash
node yoghurt-chat-backend.js
```

Der Server läuft standardmäßig auf `http://localhost:3000`.

## Wichtige Ressourcen

- [API-Dokumentation](./API.md) — Endpunkte, Requests & Responses
- [Authentifizierung](./AUTH.md) — Session-Flow, Tokens, Cookies
- [Architektur](./ARCHITECTURE.md) — Modulübersicht und Datenfluss
