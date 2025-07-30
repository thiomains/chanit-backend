const db = require('./database')
const snowflake = require('./snowflake')

async function setLastMessage(channelId, message) {
    const database = await db.connectDatabase();
    const channelsCollection = database.collection("channels");
    await channelsCollection.updateOne({
            channelId: channelId
        },
        {
            $set: {
                lastMessage: message
            }
        })
}

async function getRecentDirectChannels(userId) {
    const database = await db.connectDatabase();
    const channelsCollection = database.collection("channels");
    return await channelsCollection.aggregate([
        {
            $match: {
                channelType: "direct-message",
                "directMessageChannel.members": userId
            }
        },
        {
            $sort: { lastMessageCreatedAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "lastMessage.author",
                foreignField: "id",
                as: "authorInfo"
            }
        },
        {
            $unwind: {
                path: "$authorInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                lastMessage: {
                    $mergeObjects: [
                        "$lastMessage",
                        {
                            author: {
                                userId: "$authorInfo.id",
                                username: "$authorInfo.username",
                                createdAt: "$authorInfo.createdAt"
                            }
                        }
                    ]
                }
            }
        },
        {
            $project: {
                authorInfo: 0
            }
        }
    ]).toArray()
}

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

    await channelsCollection.insertOne(channel)
    return channel
}

async function getChannel(channelId) {
    const database = await db.connectDatabase();
    const channelsCollection = database.collection("channels");
    return await channelsCollection.findOne({
        channelId: channelId
    })
}

module.exports = { createDirectChannel, getChannel, setLastMessage, getRecentDirectChannels }