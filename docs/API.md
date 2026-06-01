# Chanit API Documentation

Base URL: `https://api.chanit.app` (or your deployment URL)

## Authentication

Most endpoints require authentication via a **Bearer token** in the `Authorization` header and a **`session` header**.

```
Authorization: Bearer <accessToken>
session: <sessionId>
```

> **Note:** The `session` value must be passed as an HTTP header, not a cookie cookie. The cookie is only used for `/api/auth/*` routes (refresh, logout).

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- `username`: 3-24 characters, must start with a letter, may contain letters, numbers, dots (.), dashes (-), and underscores (_)
- `email`: Valid email format
- `password`: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character

**Response (201 Created):**
```json
{
  "message": "Account created successfully"
}
```
Also sets a session cookie.

**Error Responses:**
- `400 Bad Request`: Missing fields or validation failed
- `409 Conflict`: Email or username already taken

---

#### POST `/api/auth/faser`
OAuth login/register via Faser.

**Request Body:**
```json
{
  "code": "<faser_auth_code>"
}
```

**Response (200 OK / 201 Created):**
```json
{
  "message": "Logged in successfully" // or "Account created successfully"
}
```
Also sets a session cookie.

**Error Responses:**
- `409 Conflict`: Email is already taken

---

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Logged in successfully"
}
```
Also sets a session cookie.

**Error Responses:**
- `400 Bad Request`: Invalid email or password

---

#### POST `/api/auth/logout`
Logout and invalidate the current session.

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `404 Not Found`: Not logged in (no session cookie)

---

#### POST `/api/auth/session/refresh`
Refresh the access token using the session cookie.

**Response (200 OK):**
```json
{
  "sessionId": "123456789",
  "refreshToken": "<refresh_token>",
  "accessToken": "<new_access_token>",
  "accessTokenExpiresAt": 1717009000000,
  "expiresAt": 1717600000000,
  "createdAt": 1717000000000,
  "lastUsed": 1717000000000,
  "active": true,
  "deviceIdentifier": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```
Also updates the session cookie.

**Error Responses:**
- `401 Unauthorized`: Invalid or expired session

---

#### GET `/api/auth/me`
Get the current user's profile.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "userId": "123456789",
  "username": "johndoe",
  "profilePictureUrl": "https://cdn.faser.app/...",
  "bio": "Hello world",
  "createdAt": 1717000000000,
  "loginName": "johndoe"
}
```

---

#### POST `/api/auth/verification-code/verify`
Verify email with a verification code.

**Auth Required:** Yes

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "Account e-mail address verified"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired verification code
- `409 Conflict`: Account email already verified

---

#### POST `/api/auth/verification-code/`
Resend verification code to email.

**Auth Required:** Yes  
**Rate Limited:** 1 request per 2 minutes

**Response (200 OK):**
```json
{
  "message": "Verification code sent to john@example.com"
}
```

**Error Responses:**
- `409 Conflict`: Account email already verified

---

## Users

#### GET `/api/user/:id`
Get public user data.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "userId": "123456789",
  "username": "johndoe",
  "createdAt": 1717000000000
}
```

**Error Responses:**
- `404 Not Found`: User not found

---

#### GET `/api/user/:id/profile`
Get a user's full profile.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "userId": "123456789",
  "username": "johndoe",
  "profilePictureUrl": "https://cdn.faser.app/...",
  "bio": "Hello world",
  "createdAt": 1717000000000
}
```

**Error Responses:**
- `404 Not Found`: User profile not found

---

#### GET `/api/user/:id/friends`
Get friends list or mutual friends.

**Auth Required:** Yes

If `:id` is `me` or the current user's ID, returns the full friends list. Otherwise returns mutual friends.

**Response (200 OK):**
```json
[
  {
    "user": {
      "userId": "987654321",
      "username": "janedoe",
      "createdAt": 1717000000000
    },
    "createdAt": 1717100000000
  }
]
```

---

#### POST `/api/user/:id/friends`
Send or accept a friend request.

**Auth Required:** Yes

**Response (200 OK) - Request accepted:**
```json
{
  "message": "Friend request accepted"
}
```

**Response (203 Non-Authoritative Information) - Request sent:**
```json
{
  "message": "Friend request sent"
}
```

**Error Responses:**
- `400 Bad Request`: Cannot add yourself as a friend
- `404 Not Found`: User not found
- `409 Conflict`: Already friends or request already sent

---

#### DELETE `/api/user/:id/friends`
Remove a friend, cancel a request, or decline a request.

**Auth Required:** Yes

**Response (204 No Content):**
```json
{
  "message": "Removed friend" // or "Cancelled friend request" / "Declined friend request"
}
```

**Error Responses:**
- `400 Bad Request`: Cannot remove yourself as a friend
- `404 Not Found`: No friendship or pending request exists

---

#### GET `/api/user/:id/friends/requests`
Get incoming and outgoing friend requests.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "in": [
    {
      "from": "987654321",
      "createdAt": 1717100000000
    }
  ],
  "out": [
    {
      "to": "555666777",
      "createdAt": 1717200000000
    }
  ]
}
```

---

#### GET `/api/user/me/recent`
Get recent direct message channels.

**Auth Required:** Yes

**Response (200 OK):**
```json
[
  {
    "channelId": "111222333",
    "channelType": "direct-message",
    "directMessageChannel": {
      "members": [
        {
          "userId": "987654321",
          "username": "janedoe",
          "profilePictureUrl": "https://cdn.faser.app/..."
        }
      ]
    },
    "lastMessage": {
      "messageId": "444555666",
      "body": "Hello!",
      "createdAt": 1717300000000,
      "author": {
        "userId": "987654321",
        "username": "janedoe"
      }
    }
  }
]
```

---

## Channels

#### GET `/api/channel/:id`
Get channel metadata.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "channelId": "111222333",
  "channelType": "direct-message",
  "directMessageChannel": {
    "members": [
      {
        "userId": "123456789",
        "username": "johndoe"
      },
      {
        "userId": "987654321",
        "username": "janedoe"
      }
    ]
  },
  "lastMessage": {
    "messageId": "444555666",
    "body": "Hello!",
    "createdAt": 1717300000000
  }
}
```

**Error Responses:**
- `403 Forbidden`: No access to this channel
- `404 Not Found`: Channel not found

---

#### GET `/api/channel/:id/messages`
Get messages in a channel.

**Auth Required:** Yes

**Query Parameters:**
- `before` (optional): Timestamp to paginate before (default: current time)
- `limit` (optional): Number of messages to return (default: 50)

**Response (200 OK):**
```json
[
  {
    "messageId": "444555666",
    "channelId": "111222333",
    "createdAt": 1717300000000,
    "author": {
      "userId": "987654321",
      "username": "janedoe",
      "profilePictureUrl": "https://cdn.faser.app/..."
    },
    "body": "Hello!",
    "attachments": [],
    "active": true,
    "embeds": []
  }
]
```

**Error Responses:**
- `403 Forbidden`: No access to this channel
- `404 Not Found`: Channel not found

---

#### POST `/api/channel/:id/messages`
Send a message to a channel.

**Auth Required:** Yes

**Request Body:**
```json
{
  "body": "Hello everyone!",
  "attachmentCount": 0
}
```

**Validation Rules:**
- `body`: Required if no attachments. Trimmed, cannot be empty if `attachmentCount` is 0
- `attachmentCount`: Maximum 9 attachments
- URLs in the body will automatically generate up to 3 embeds

**Response (201 Created):**
```json
{
  "messageId": "444555666",
  "channelId": "111222333",
  "createdAt": 1717300000000,
  "author": "123456789",
  "body": "Hello everyone!",
  "attachments": [],
  "active": true,
  "embeds": []
}
```

**Error Responses:**
- `400 Bad Request`: Empty message without attachments or too many attachments
- `403 Forbidden`: No access to this channel
- `404 Not Found`: Channel not found

---

## Messages

#### POST `/api/message/:id/attachments`
Upload a file attachment to a message.

**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

The message must have been created with `attachmentCount > 0` and have pending attachment slots (url: "").

**Request Body:**
- `attachment`: The file to upload

**Response (203 Non-Authoritative Information):**
```json
{
  "fileUrl": "https://cdn.faser.app/chanit/attachments/..."
}
```

**Error Responses:**
- `400 Bad Request`: No file sent, no attachments to upload, or all slots filled
- `403 Forbidden`: You are not the author of this message
- `404 Not Found`: Message not found

---

#### DELETE `/api/message/:id/`
Delete a message (soft delete).

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "message": "Message deleted"
}
```

**Error Responses:**
- `403 Forbidden`: You are not the author of this message
- `404 Not Found`: Message not found or already deleted

---

#### PATCH `/api/message/:id/`
Edit a message.

**Auth Required:** Yes

**Request Body:**
```json
{
  "body": "Updated message content"
}
```

**Response (200 OK):**
```json
{
  "message": "Message edited"
}
```

**Error Responses:**
- `400 Bad Request`: Body cannot be empty
- `403 Forbidden`: You are not the author of this message
- `404 Not Found`: Message not found or already deleted

---

## Settings

#### POST `/api/settings/profile/`
Update username and/or bio.

**Auth Required:** Yes

**Request Body:**
```json
{
  "username": "newusername",
  "bio": "My new bio"
}
```

**Validation Rules:**
- At least one field (`username` or `bio`) must be provided
- `bio`: Maximum 400 characters

**Response (200 OK):**
```json
{
  "userId": "123456789",
  "username": "newusername",
  "profilePictureUrl": "https://cdn.faser.app/...",
  "bio": "My new bio",
  "createdAt": 1717000000000
}
```

**Error Responses:**
- `400 Bad Request`: No fields provided or bio too long

---

#### POST `/api/settings/profile/avatar`
Upload a new avatar.

**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

**Request Body:**
- `avatar`: Image file (will be resized to 320x320 JPEG)

**Response (200 OK):**
```json
{
  "userId": "123456789",
  "username": "johndoe",
  "profilePictureUrl": "https://cdn.faser.app/chanit/avatars/...",
  "bio": "Hello world",
  "createdAt": 1717000000000
}
```

**Error Responses:**
- `400 Bad Request`: No file sent

---

#### DELETE `/api/settings/profile/avatar`
Remove the current avatar.

**Auth Required:** Yes

**Response (200 OK):** Empty body

---

#### POST `/api/settings/data/`
Request a GDPR data export.

**Auth Required:** Yes

Downloads a ZIP file containing all user data:
- `user.json` - Account information
- `profile.json` - Profile data
- `sessions.json` - Session history
- `channels.json` - Channel memberships
- `friends.json` - Friends list
- `friend-requests.json` - Friend requests
- `messages.json` - Message history
- `notifications.json` - Notifications
- `codes.json` - Verification codes

**Response:** ZIP file download (`user-data.zip`)

**Error Responses:**
- `500 Internal Server Error`: Failed to create archive

---

## Notifications

#### GET `/api/notifications`
Get all notifications for the current user.

**Auth Required:** Yes

**Response (200 OK):**
```json
[
  {
    "notificationId": "777888999",
    "userId": "123456789",
    "type": "message",
    "data": {
      "messageId": "444555666",
      "channelId": "111222333",
      "body": "Hello!"
    },
    "createdAt": 1717400000000,
    "dismissed": false
  }
]
```

---

#### DELETE `/api/notifications/:id`
Dismiss a notification.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "message": "Notification removed"
}
```

**Error Responses:**
- `404 Not Found`: Notification not found

---

## Admin

#### GET `/api/admin/users`
Get all users or a specific user (admin only).

**Auth Required:** Yes  
**Permissions Required:** `adminAccess`, `viewUserInformation`

**Query Parameters:**
- `userId` (optional): Get a specific user instead of all users

**Response (200 OK) - All users:**
```json
[
  {
    "id": "123456789",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": 1717000000000
  }
]
```

**Response (200 OK) - Specific user:**
```json
{
  "id": "123456789",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": 1717000000000,
  "profile": { ... },
  "friends": [ ... ],
  "sessions": [ ... ]
}
```

---

#### GET `/api/admin/me`
Get current admin user's permissions.

**Auth Required:** Yes  
**Permissions Required:** `adminAccess`

**Response (200 OK):**
```json
{
  "userId": "123456789",
  "adminAccess": true,
  "viewUserInformation": true
}
```

---

## WebSocket

#### WS `/events`
Real-time events connection.

**Auth Required:** Yes (via query parameters)

**Connection URL:**
```
wss://api.chanit.app/events?token=<accessToken>&session=<sessionId>
```

> **Note:** WebSocket handshake cannot send custom headers. Therefore the token and sessionId are passed as query parameters, unlike REST endpoints which use the `Authorization` and `session` headers.

### Client -> Server Messages

#### `view-channel`
Indicates the user is currently viewing a channel.
```json
{
  "type": "view-channel",
  "channelId": "111222333"
}
```

#### `typing`
Sent when the user is typing.
```json
{
  "type": "typing",
  "channelId": "111222333"
}
```

### Server -> Client Messages

#### `authentication-success`
```json
{
  "type": "authentication-success",
  "message": "Successfully authenticated"
}
```

#### `authentication-failure`
```json
{
  "type": "authentication-failure",
  "message": "Invalid or expired session"
}
```

#### `ping`
Sent every 10 seconds to keep the connection alive.
```json
{
  "type": "ping"
}
```

#### `message`
New message in a channel.
```json
{
  "type": "message",
  "message": {
    "messageId": "444555666",
    "channelId": "111222333",
    "createdAt": 1717300000000,
    "author": {
      "userId": "987654321",
      "username": "janedoe",
      "profilePictureUrl": "https://cdn.faser.app/..."
    },
    "body": "Hello!",
    "attachments": [],
    "active": true,
    "embeds": []
  }
}
```

#### `message-edit`
A message was edited.
```json
{
  "type": "message-edit",
  "messageId": "444555666",
  "body": "Updated content",
  "lastEdited": 1717350000000
}
```

#### `message-delete`
A message was deleted.
```json
{
  "type": "message-delete",
  "messageId": "444555666"
}
```

#### `typing`
Another user is typing.
```json
{
  "type": "typing",
  "channelId": "111222333",
  "userId": "987654321"
}
```

#### `online-status`
Friend's online status changed.
```json
{
  "type": "online-status",
  "userId": "987654321",
  "status": "online" // or "offline"
}
```

---

## Data Models

### User
```json
{
  "id": "123456789",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "<hashed_password>",
  "createdAt": 1717000000000,
  "active": true,
  "emailVerified": false,
  "faserId": "<faser_user_id>"
}
```

### Profile
```json
{
  "userId": "123456789",
  "username": "johndoe",
  "profilePictureUrl": "https://cdn.faser.app/...",
  "bio": "Hello world",
  "createdAt": 1717000000000
}
```

### Message
```json
{
  "messageId": "444555666",
  "channelId": "111222333",
  "createdAt": 1717300000000,
  "author": "123456789",
  "body": "Hello!",
  "attachments": [
    {
      "url": "https://cdn.faser.app/...",
      "mimetype": "image/png",
      "attachmentId": "555666777",
      "fileName": "image.png",
      "fileSize": 12345
    }
  ],
  "active": true,
  "embeds": [
    {
      "title": "Example",
      "description": "...",
      "url": "https://example.com",
      "image": "https://example.com/image.png"
    }
  ],
  "lastEdited": 1717350000000
}
```

### Channel
```json
{
  "channelId": "111222333",
  "channelType": "direct-message",
  "directMessageChannel": {
    "members": [
      {
        "userId": "123456789",
        "username": "johndoe"
      }
    ],
    "createdAt": 1717300000000
  },
  "lastMessage": { ... },
  "lastMessageCreatedAt": 1717300000000,
  "createdAt": 1717300000000
}
```

### Session
```json
{
  "sessionId": "123456789",
  "userId": "123456789",
  "refreshToken": "<hashed_token>",
  "accessToken": "<hashed_token>",
  "accessTokenExpiresAt": 1717009000000,
  "expiresAt": 1717600000000,
  "createdAt": 1717000000000,
  "lastUsed": 1717000000000,
  "active": true,
  "deviceIdentifier": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

### Notification
```json
{
  "notificationId": "777888999",
  "userId": "123456789",
  "type": "message",
  "content": {
    "messageId": "444555666",
    "channelId": "111222333",
    "body": "Hello!"
  },
  "createdAt": 1717400000000,
  "dismissed": false
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created successfully
- `203 Non-Authoritative Information` - Success with minor caveat (e.g., request sent but not yet accepted)
- `204 No Content` - Success, no content to return
- `400 Bad Request` - Invalid request body or parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., already exists)
- `500 Internal Server Error` - Server error
