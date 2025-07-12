const db = require('./database.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const snowflake = require("./snowflake.js");

async function createSession(user, device, ip) {

    const database = await db.connectDatabase();
    const sessionsCollection = database.collection("sessions");

    const refreshToken = generateToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = {
        sessionId: snowflake.generateId(),
        userId: user,
        refreshToken: refreshTokenHash,
        accessToken: "",
        accessTokenExpiresAt: Date.now() + 1000 * 60 * 15,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        active: true,
        deviceIdentifier: device,
        ipAddress: ip
    }

    await sessionsCollection.insertOne(session);

    session.refreshToken = refreshToken;
    return session;
}

function generateToken() {
    return crypto.randomBytes(48).toString("base64url");
}

async function refreshToken(sessionId, refreshToken) {
    const database = await db.connectDatabase();
    const sessionsCollection = database.collection("sessions");

    const session = await sessionsCollection.findOne({sessionId: sessionId});
    if (!session) {
        return null;
    }

    if (session.active === false) {
        return null;
    }

    if (session.expiresAt < Date.now()) {
        return null;
    }

    const refreshTokenValid = await bcrypt.compare(refreshToken, session.refreshToken);
    if (!refreshTokenValid) {
        console.log("refresh token is invalid")
        return null;
    }

    const newAccessToken = generateToken();
    session.accessToken = await bcrypt.hash(newAccessToken, 10);
    session.accessTokenExpiresAt = Date.now() + 1000 * 60 * 15;
    session.lastUsed = Date.now();

    await sessionsCollection.updateOne({sessionId: session.sessionId}, {$set: session});

    session.refreshToken = refreshToken;
    session.accessToken = newAccessToken;
    return session;
}

function setSessionCookieAndSend(res, session, status, message) {
    const cookieContent = {
        sessionId: session.sessionId,
        refreshToken: session.refreshToken
    }

    res.status(status).cookie("session", cookieContent, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: "/api/auth/session/refresh"
    }).send(message);
}

module.exports = {createSession, refreshToken, setSessionCookieAndSend};