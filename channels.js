const db = require('./database')
const snowflake = require('./snowflake')

async function createDirectChannel(friendship) {
    const database = await db.connectDatabase();
    const channelsCollection = database.collection("channels");
    const channel = {
        channelType: "direct-message",
        channelId: snowflake.generateId(),
        createdAt: Date.now(),
        directMessageChannel: {
            members: friendship.users,
            createdAt: friendship.friendsSince,
        }
    }

    return await channelsCollection.insertOne(channel)
}

async function getChannel(channelId) {
    const database = await db.connectDatabase();
    const channelsCollection = database.collection("channels");
    return await channelsCollection.findOne({
        channelId: channelId
    })
}

module.exports = { createDirectChannel, getChannel }