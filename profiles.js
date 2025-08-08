const db = require('./database.js');
const users = require('./users')

async function getProfile(userId) {
    const database = await db.connectDatabase()
    const profilesCollection = database.collection("profiles");
    const profile = await profilesCollection.findOne({
        userId: userId
    })
    if (!profile) {
        const user = await users.getUser(userId)
        if (user) return await createProfile(user)
    }
    return profile
}

async function createProfile(user) {
    const database = await db.connectDatabase()
    const profilesCollection = database.collection("profiles");
    const profile = {
        userId: user.id,
        username: user.username,
        profilePictureUrl: "",
        bio: "",
        createdAt: user.createdAt
    }
    await profilesCollection.insertOne(profile)
    return profile
}

async function updateProfilePictureUrl(userId, url) {
    const database = await db.connectDatabase()
    const profilesCollection = database.collection("profiles");
    await profilesCollection.updateOne({
        userId: userId
        },
        {
            $set: {
                profilePictureUrl: url
            }
        })
}

module.exports = { getProfile, createProfile, updateProfilePictureUrl }
