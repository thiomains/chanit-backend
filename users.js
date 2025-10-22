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

async function getUser(userId) {
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
        emailVerified: false
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

async function setUserActive(userId, active) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");
    await usersCollection.updateOne({
            id: userId
        },
        {
            $set: {
                active: active
            }
        })
}

async function setUserVerified(userId, verified) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");
    await usersCollection.updateOne({
            id: userId
        },
        {
            $set: {
                emailVerified: verified
            }
        })
}

async function getAllUsers() {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    const result = await usersCollection
        .aggregate([
            {
                $lookup: {
                    from: "profiles",
                    localField: "id",
                    foreignField: "userId",
                    as: "profile"
                }
            },
            {
                $unwind: {
                    path: "$profile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    password: 0,
                    _id: 0
                }
            }
        ])
        .toArray();

    return result;

}

module.exports = { getPublicUser, getUserByName, getUserByEmail, createAccount, getUserByFaser, getUser, setUserActive, setUserVerified, getAllUsers };