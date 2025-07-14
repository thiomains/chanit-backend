const db = require('./database')

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

module.exports = { getPublicUser };