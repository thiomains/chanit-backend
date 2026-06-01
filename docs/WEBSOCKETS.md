# WebSockets

Der Echtzeit-Chat läuft über einen einzelnen WebSocket-Pfad.

## Verbindung

```
WS /events?token=<accessToken>&session=<sessionId>
```

**Wichtig:** WebSocket-Handshake akzeptiert **keine** `Authorization`-Header. Token und Session-ID müssen als Query-Parameter übergeben werden.

## Authentifizierung

Sofort nach dem Verbindungsaufbau validiert der Server beide Credentials via `sessions.validateAccess()`. Ergebnisse:

| Event | Bedeutung |
|---|---|
| `authentication-success` | Verbindung steht, Nutzer kann Events empfangen/senden |
| `authentication-failure` | Token oder Session ungültig/abgelaufen; Verbindung wird geschlossen |

## Heartbeat (Ping)

Der Server sendet alle **10 Sekunden** einen `ping`, um Timeouts auf Proxy-Ebene zu verhindern:

```json
{ "type": "ping" }
```

## Client → Server Nachrichten

### Channel beitreten / ansehen

```json
{
  "type": "view-channel",
  "channelId": "1234567890123456789"
}
```

Teilt dem Server mit, in welchem Channel der Nutzer gerade aktiv ist. Ermöglicht gezielte Broadcasts.

### Tippen-Indikator

```json
{
  "type": "typing",
  "channelId": "1234567890123456789"
}
```

Wird an alle anderen Teilnehmer des Channels weitergeleitet.

## Server → Client Events

| Event | Beschreibung |
|---|---|
| `authentication-success` | Handshake erfolgreich |
| `authentication-failure` | Handshake fehlgeschlagen |
| `ping` | Keep-alive (10s Intervall) |
| `online-status` | Freund ist online/offline gegangen |
| `typing` | Jemand tippt im aktuellen Channel |

### Online-Status

```json
{
  "type": "online-status",
  "userId": "9876543210987654321",
  "status": "online"
}
```

Oder `offline`, wenn sich der Nutzer ausloggt oder die letzte Verbindung trennt.

## Multi-Device-Support

Ein Nutzer kann mehrere parallele WebSocket-Verbindungen halten (z. B. Handy + Desktop). Der Server verwaltet diese in einem `Set` pro `userId`. Der Online-Status wechselt erst auf `offline`, wenn die **letzte** Verbindung geschlossen wird.

## Interne Broadcast-Funktionen

| Funktion | Zweck |
|---|---|
| `sendMessage(userId, message)` | Sendet ein Event an alle Verbindungen eines Nutzers |
| `sendOnline(userId, online)` | Informiert alle Freunde über Statusänderung |
| `sendFriendsOnline(userId)` | Schickt dem neu verbundenen Nutzer die aktuell online Freunde |

Alle Funktionen werden von `events.js` exportiert und können von Endpoints aufgerufen werden, um Live-Updates auszulösen.
