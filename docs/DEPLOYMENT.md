# Deployment

## Übersicht

Chanit-Backend läuft als einzelner Node.js-Prozess. Es ist nicht containerisiert und wird direkt via `node yoghurt-chat-backend.js` gestartet.

## Voraussetzungen

- Node.js (aktuelle LTS)
- MongoDB (lokal, Docker oder Atlas)
- S3-kompatibler Object-Storage (z. B. AWS S3, MinIO, Faser CDN)
- SMTP-Server (z. B. Postfix, Mailgun, eigener Mailserver)

## Environment-Variablen

Alle sensiblen Werte und Infrastruktur-Adressen kommen aus einer `.env`-Datei im Projektroot.

### Datenbank

| Variable | Beispiel | Beschreibung |
|---|---|---|
| `MONGODB_URL` | `mongodb://localhost:27017` | Verbindungs-URI |
| `MONGODB_DB` | `chanit` | Datenbankname |

### App

| Variable | Beispiel | Beschreibung |
|---|---|---|
| `PORT` | `3000` | HTTP-Port |

### E-Mail (SMTP)

| Variable | Beispiel | Beschreibung |
|---|---|---|
| `MAIL_SERVER` | `mail.chanit.app` | SMTP-Host |
| `MAIL_SERVER_PORT` | `465` | SMTP-Port (TLS) |
| `MAIL_USERNAME` | `chanit-noreply@thimocolditz.de` | Login-User |
| `MAIL_PASSWORD` | `***` | Login-Passwort |

> Die Absender-Adresse ist in `mailSender.js` hartcodiert auf `chanit-noreply@thimocolditz.de`.

### S3 / Datei-Storage

| Variable | Beispiel | Beschreibung |
|---|---|---|
| `S3_SERVER` | `https://s3.eu-central-1.amazonaws.com` | S3-kompatibler Endpunkt |
| `S3_ACCESS_KEY` | `AKI...` | Access Key |
| `S3_SECRET_KEY` | `***` | Secret Key |
| `S3_ATTACHMENTS_BUCKET` | `chanit-attachments` | Bucket für Nachrichten-Anhänge |
| `S3_AVATARS_BUCKET` | `chanit-avatars` | Bucket für Profilbilder |

> Die öffentliche CDN-URL ist in `attachments.js` und `avatar.js` hartcodiert auf `https://cdn.faser.app/chanit/`.

### OAuth (Faser)

| Variable | Beispiel | Beschreibung |
|---|---|---|
| `FASER_CLIENT_ID` | `...` | Client-ID für Faser-Login |
| `FASER_CLIENT_SECRET` | `...` | Client-Secret für Faser-Login |

## CORS & Reverse Proxy

Das Backend ist für den Betrieb hinter einem Reverse Proxy konfiguriert:

```js
app.set('trust proxy', 1)
```

Erlaubte Origins:

- `https://chanit.app`
- `http://localhost:3000`

## Start im Produktivbetrieb

```bash
# Abhängigkeiten installieren
npm install

# Server starten
node yoghurt-chat-backend.js
```

Für Produktion empfiehlt sich ein Prozess-Manager wie **PM2** oder ein Systemd-Service, damit der Prozess bei Abstürzen neu startet.

### PM2-Beispiel

```bash
npm install -g pm2
pm2 start yoghurt-chat-backend.js --name chanit-backend
pm2 save
pm2 startup
```

### Systemd-Beispiel

```ini
# /etc/systemd/system/chanit-backend.service
[Unit]
Description=Chanit Backend
After=network.target

[Service]
Type=simple
User=chanit
WorkingDirectory=/opt/chanit-backend
ExecStart=/usr/bin/node yoghurt-chat-backend.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Sicherheitshinweise

- `.env` niemals in Git einchecken (liegt bereits in `.gitignore`)
- Das Session-System in `sessions.js` generiert eigene Token — stelle sicher, dass die Session-Datenbank gut abgesichert ist
- Rate-Limiting ist aktiv für Verifikationscodes; für weitere Endpunkte kann `express-rate-limit` ergänzt werden
- Das Backend nutzt `trust proxy` — stelle sicher, dass der Reverse Proxy korrekt konfiguriert ist, damit IP-Adressen nicht gefälscht werden
