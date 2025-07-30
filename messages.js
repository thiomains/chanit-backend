const db = require('./database')
const snowflake = require('./snowflake')

async function createMessage(channelId, author, body) {
    const database = await db.connectDatabase();
    const messagesCollection = database.collection("messages");
    const message = {
        messageId: snowflake.generateId(),
        channelId: channelId,
        createdAt: Date.now(),
        author: author,
        body: body,
    }

    await messagesCollection.insertOne(message)
    return message
}

async function getMessages(channelId) {

    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    return await (await messagesCollection.aggregate([
        {
            $match: {
                channelId: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "id",
                as: "author"
            }
        },
        {
            $unwind: "$author"
        },
        {
            $project: {
                messageId: 1,
                channelId: 1,
                createdAt: 1,
                body: 1,
                "author.id": 1,
                "author.username": 1,
                "author.createdAt": 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $limit: 50
        }
    ])).toArray()
}

module.exports = { createMessage, getMessages }