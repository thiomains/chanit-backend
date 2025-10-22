const db = require('./database')
const snowflake = require('./snowflake')

async function createMessage(channelId, author, body, attachmentCount) {
    const database = await db.connectDatabase();
    const messagesCollection = database.collection("messages");
    let attachments = []
    for (let i = 0; i < attachmentCount; i++) {
        attachments.push({
            url: ""
        })
    }
    let active = attachments.length === 0
    const message = {
        messageId: snowflake.generateId(),
        channelId: channelId,
        createdAt: Date.now(),
        author: author,
        body: body,
        attachments: attachments,
        active: active
    }

    await messagesCollection.insertOne(message)
    return message
}

async function getMessages(channelId, beforeTimestamp, limit) {
    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    return await (await messagesCollection.aggregate([
        {
            $match: {
                channelId: channelId,
                createdAt: {
                    $lt: beforeTimestamp
                },
                active: true
            }
        },
        {
            $lookup: {
                from: "profiles",
                localField: "author",
                foreignField: "userId",
                as: "author"
            }
        },
        {
            $unwind: "$author"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $limit: limit
        }
    ])).toArray()
}

async function getMessage(messageId) {

    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    return (await (await messagesCollection.aggregate([
        {
            $match: {
                messageId: messageId
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
                attachments: 1,
                messageId: 1,
                channelId: 1,
                createdAt: 1,
                body: 1,
                active: 1,
                "author.id": 1,
                "author.username": 1,
                "author.createdAt": 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])).toArray())[0]
}

async function setAttachment(messageId, index, attachment) {
    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    await messagesCollection.updateOne(
        { messageId: messageId },
        { $set: { [`attachments.${index}`]: attachment } }
    );
}

async function setActive(messageId, active) {
    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    await messagesCollection.updateOne(
        { messageId: messageId },
        { $set: { active: active } }
    );
}

async function editMessageBody(messageId, body) {
    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    await messagesCollection.updateOne(
        { messageId: messageId },
        { $set: { body: body } }
    );
}

module.exports = { createMessage, getMessages, getMessage, setAttachment, setActive, editMessageBody }