const db = require('./database')
const snowflake = require("./snowflake");

async function getPublicUser(userId) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    const user = await usersCollection.findOne({
        id: userId
    });
    if (!user) {
        return null;
    }
    if (!user.active) {
        return null;
    }

    return {
        userId: user.id,
        username: user.username,
        createdAt: user.createdAt,
    }

}

async function getUserByName(username) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    const user = await usersCollection.findOne({
        username: username
    });
    if (!user) {
        return null;
    }
    if (!user.active) {
        return null;
    }

    return user
}

async function getUserByEmail(emailAddress) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    const user = await usersCollection.findOne({
        email: emailAddress
    });
    if (!user) {
        return null;
    }
    if (!user.active) {
        return null;
    }

    return user
}

async function createAccount(username, email, passwordHash, faserId) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    const user = {
        id: snowflake.generateId(),
        username: username,
        email: email,
        password: passwordHash,
        createdAt: Date.now(),
        active: true,
        profile: {},
    }

    if (faserId) {
        user.faserId = faserId;
    }

    await usersCollection.insertOne(user);

    return user
}

async function getUserByFaser(faser) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    const user = await usersCollection.findOne({
        faserId: faser
    });
    if (!user) {
        return null;
    }
    if (!user.active) {
        return null;
    }

    return user
}

module.exports = { getPublicUser, getUserByName, getUserByEmail, createAccount, getUserByFaser };