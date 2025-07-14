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
        path: "/api/auth/"
    }).send(message);
}

async function invalidateSessionById(sessionId) {
    const database = await db.connectDatabase();
    const sessionsCollection = database.collection("sessions");
    await sessionsCollection.updateOne({sessionId: sessionId}, {$set: {active: false}});
}

async function getSession(sessionId) {
    const database = await db.connectDatabase();
    const sessionsCollection = database.collection("sessions");
    return await sessionsCollection.findOne({sessionId: sessionId});
}

function isSessionValid(session) {
    if (!session) {
        return false;
    }
    if (session.active === false) {
        return false;
    }
    if (session.expiresAt < Date.now()) {
        return false;
    }
    return true;
}

async function isAccessTokenValid(session, accessToken) {
    if (!isSessionValid(session)) {
        return false;
    }
    if (session.accessTokenExpiresAt < Date.now()) {
        return false;
    }
    return await bcrypt.compare(accessToken, session.accessToken);
}

async function validateAccess(sessionId, accessToken) {

    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");
    const session = await getSession(sessionId);
    if (!await isAccessTokenValid(session, accessToken)) {
        return [];
    }
    const user = await usersCollection.findOne({id: session.userId});
    console.log(user)
    if (!user.active) {
        return [];
    }
    return [user]

}

module.exports = {createSession, refreshToken, setSessionCookieAndSend, invalidateSessionById, getSession, isSessionValid, isAccessTokenValid, validateAccess};