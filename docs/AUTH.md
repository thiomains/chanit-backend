# Authentifizierung

Chanit verwendet ein **eigenes Session-System** aus Bearer-Access-Token, Session-ID und optionalem E-Mail-Verifikationscode. Es kommt **kein JWT** zum Einsatz — Tokens sind zufällige Base64-Strings, die serverseitig mit bcrypt gehasht in der `sessions`-Collection gespeichert werden.

## Überblick

| Komponente | Zweck |
|---|---|
| **Access Token** | Kurzlebiges Token (15 Minuten) im `Authorization: Bearer ...` Header |
| **Session ID** | Eindeutige Session-Kennung (im `session`-Header oder Refresh-Cookie) |
| **Refresh Token** | Langlaufendes Token (7 Tage) zum Erneuern des Access-Tokens |
| **Verification Code** | Einmalcode per E-Mail zur Bestätigung der E-Mail-Adresse |

## Authentifizierungs-Flow

### 1. Registrierung

```
POST /api/auth/register
```

Erstellt ein Benutzerkonto und legt eine neue Session an. Gibt Access-Token, Refresh-Token und Session-ID zurück und setzt ein Session-Cookie (nur für `/api/auth/` gültig).

### 2. Login

```
POST /api/auth/login
```

Authentifiziert mit E-Mail/Passwort und gibt neue Credentials aus.

### 3. Session-Refresh

```
POST /api/auth/session/refresh
```

Erneuert den Access-Token anhand der gültigen Session. Wird automatisch vom Client aufgerufen, wenn der Token abläuft. Liest Session-Daten aus dem Cookie (da der Pfad `/api/auth/` ist).

### 4. Logout

```
POST /api/auth/logout
```

Invalidiert die Session serverseitig und entfernt das Cookie.

## Geschützte Endpunkte

Alle Routen unterhalb dieser Pfade erfordern `authMiddleware`:

- `/api/auth/me`
- `/api/auth/verification-code/`
- `/api/user/`
- `/api/channel/`
- `/api/message/`
- `/api/settings/`
- `/api/notifications/`
- `/api/admin/`

Das `authMiddleware` prüft die Gültigkeit des Bearer-Tokens **und** der Session-ID. Fehlt eines von beidem, wird die Anfrage mit `401` abgelehnt. Zusätzlich wird geprüft, ob die E-Mail-Adresse bereits verifiziert wurde (außer für `/api/auth/verification-code`).

## Rate Limiting

Die Anforderung von Verifikationscodes ist stark ratenlimitiert:

```
POST /api/auth/verification-code/
```

- **Fenster:** 2 Minuten
- **Max. Anfragen:** 1 pro Fenster
- **Fehlermeldung:** *"You need to wait 120 seconds between requesting verification codes"*

## Header-Format (geschützte Endpunkte)

Für alle geschützten Endpunkte (außer WebSocket) müssen beide Header gesendet werden:

```http
Authorization: Bearer <accessToken>
session: <sessionId>
```

## Session-Cookie

Bei Registrierung, Login und Refresh wird ein HTTP-only, SameSite=strict Cookie gesetzt:

```
session={sessionId, refreshToken}; Path=/api/auth/;
```

Dieses Cookie wird **nur** an Routen unter `/api/auth/` gesendet (z. B. `/api/auth/session/refresh` oder `/api/auth/logout`). Für alle anderen Endpunkte muss der Client die Session-ID explizit als Header übergeben.

## CORS

Das Backend erlaubt Credentials für folgende Origins:

- `https://chanit.app` (Produktion)
- `http://localhost:3000` (Entwicklung)
