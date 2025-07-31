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
            $lookup: {
                from: "users",
                localField: "directMessageChannel.members",
                foreignField: "id",
                as: "memberUsers"
            }
        },
        {
            $addFields: {
                lastMessage: {
                    $cond: {
                        if: { $gt: [{ $type: "$lastMessage" }, "missing"] },
                        then: {
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
                        },
                        else: null
                    }
                },
                'directMessageChannel.members': {
                    $map: {
                        input: "$memberUsers",
                        as: "user",
                        in: {
                            userId: "$$user.id",
                            username: "$$user.username",
                            createdAt: "$$user.createdAt"
                        }
                    }
                }
            }
        },
        {
            $project: {
                authorInfo: 0,
                memberUsers: 0
            }
        }
    ]).toArray();
}

async function getFriendDirectChannel(friendship) {
    const database = await db.connectDatabase();
    const channelsCollection = database.collection("channels");
    const directChannel = await (await (await channelsCollection.aggregate([
        {
            $match: {
                channelType: "direct-message",
                "directMessageChannel.members": {
                    $all: friendship.users,
                    $size: 2
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "directMessageChannel.members",
                foreignField: "id",
                as: "memberUsers"
            }
        },
        {
            $project: {
                _id: 0,
                channelId: 1,
                createdAt: 1,
                lastMessage: 1,
                members: {
                    $map: {
                        input: "$memberUsers",
                        as: "user",
                        in: {
                            userId: "$$user.id",
                            username: "$$user.username",
                            createdAt: "$$user.createdAt"
                        }
                    }
                }
            }
        }
    ])).toArray())[0]
    if (directChannel) return directChannel
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
    return getFriendDirectChannel(friendship)
}

async function getChannel(channelId) {
    const database = await db.connectDatabase();
    const channelsCollection = database.collection("channels");
    let channel = await channelsCollection.findOne({
        channelId: channelId
    })
    if (channel.channelType === "direct-message") {
        channel = await (await (await channelsCollection.aggregate([
            {
                $match: {
                    channelId: channelId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "directMessageChannel.members",
                    foreignField: "id",
                    as: "memberUsers"
                }
            },
            {
                $project: {
                    _id: 0,
                    channelId: 1,
                    createdAt: 1,
                    lastMessage: 1,
                    channelType: 1,
                    "directMessageChannel.createdAt": 1,
                    "directMessageChannel.members": {
                        $map: {
                            input: "$memberUsers",
                            as: "user",
                            in: {
                                userId: "$$user.id",
                                username: "$$user.username",
                                createdAt: "$$user.createdAt"
                            }
                        }
                    }
                }
            }
        ])).toArray())[0];
    }
    return channel
}

module.exports = { getFriendDirectChannel, getChannel, setLastMessage, getRecentDirectChannels }