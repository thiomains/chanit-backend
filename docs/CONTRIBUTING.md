# Contributing

Diese Richtlinien helfen dabei, Änderungen am Chanit-Backend konsistent und nachvollziehbar zu halten.

## Projekt-Setup

```bash
git clone <repo-url>
cd chanit-backend
npm install
```

Eine `.env`-Datei mit den Variablen aus [`DEPLOYMENT.md`](./DEPLOYMENT.md) ist erforderlich.

## Branching

- `main` ist der produktive Branch.
- Für neue Features oder Fixes einen Feature-Branch erstellen:
  ```bash
  git checkout -b feature/neuer-endpoint
  ```
- Wenn möglich, kleine, fokussierte Commits mit aussagekräftigen Nachrichten:
  - `feat: add user blocking endpoint`
  - `fix: validate channelId before database query`
  - `docs: update AUTH.md with rate limit details`

## Code-Stil

Das Projekt folgt keinem strikten Linter, aber bestehender Code sollte konsistent bleiben:

### Module

- **CommonJS** verwenden (`require` / `module.exports`).
- Root-Module (z. B. `users.js`, `channels.js`) kapseln die Datenbanklogik.
- Endpoints unter `endpoints/<domain>/` implementieren nur HTTP-spezifische Aufgaben (Parsing, Statuscodes, Headers).

### Beispiel-Endpoint

```js
const channels = require("../../channels")

async function get(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)

    if (!channel) {
        res.status(404).send({
            error: "Channel not found"
        })
        return;
    }

    res.status(200).send(channel)
}

module.exports = { get }
```

### Async/Await

- Bevorzuge `async/await` statt Promise-Chains.
- Datenbankaufrufe immer mit `await` und `try/catch` absichern, falls sie fehlschlagen können.

### Fehlerbehandlung

Fehlermeldungen an den Client folgen diesem Schema:

```js
res.status(400).send({ error: "Beschreibung des Fehlers" })
```

Gängige Statuscodes:

| Code | Verwendung |
|---|---|
| `400` | Ungültige Eingabe, fehlende Felder |
| `401` | Authentifizierung fehlgeschlagen |
| `403` | Authentifiziert, aber nicht berechtigt |
| `404` | Ressource nicht gefunden |
| `409` | Konflikt (z. B. E-Mail bereits vergeben) |

### IDs

Neue Einträge in der Datenbank erhalten ihre ID über `snowflake.js`:

```js
const snowflake = require("../../snowflake");
const id = snowflake.generateId();
```

## Neuen Endpoint hinzufügen

1. **Handler erstellen** unter `endpoints/<domain>/<name>.js`.
2. **Export** als `module.exports = handler` oder `module.exports = { get, post }`.
3. **Registrieren** in `yoghurt-chat-backend.js`:
   ```js
   app.post('/api/<domain>/<route>', require('./endpoints/<domain>/<name>'))
   ```
4. **Middleware** bei Bedarf:
   ```js
   app.use('/api/<domain>/', authMiddleware)
   ```
5. **Dokumentation** in `docs/API.md` ergänzen.

## Datenbank

- Verbindung über `database.connectDatabase()` herstellen.
- Collections direkt über `db.collection("<name>")` ansprechen.
- Für neue Collections ein Modul auf Root-Ebene erstellen (z. B. `blocks.js`).

## Tests

- Es gibt aktuell kein Test-Framework im Projekt.
- Neue komplexe Logik sollte manuell gegen eine lokale MongoDB-Instanz getestet werden.
- Wichtig: Nie `.env`-Dateien oder Credentials committen.

## Fragen?

Bei Unsicherheiten am besten an bestehenden Endpoints orientieren — `endpoints/channel/channel.js` oder `endpoints/auth/register.js` sind gute Referenzen.
