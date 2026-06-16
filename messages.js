const db = require('./database')
const snowflake = require('./snowflake')

async function createMessage(channelId, author, body, attachmentCount, embeds, replyTo) {
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
        active: active,
        replyTo: replyTo || null
    }
    if (embeds) message.embeds = embeds

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
                embeds: 1,
                lastEdited: 1,
                replyTo: 1,
                replyCount: 1,
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
        { $set: {
            body: body,
            lastEdited: Date.now()
        } }
    );
}

async function getUserMessages(userId) {
    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    return await messagesCollection.find({
        author: userId
    }).toArray()
}

async function getReplyChain(messageId) {
    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")

    // Step 1: Walk up the chain to find the root message (replyTo === null)
    let rootId = messageId
    while (true) {
        const msg = await messagesCollection.findOne({ messageId: rootId })
        if (!msg || !msg.replyTo) break
        rootId = msg.replyTo
    }

    // Step 2: Walk down from root, collecting all messages in the flat chain
    const chain = []
    let currentId = rootId
    while (true) {
        const results = await messagesCollection.aggregate([
            { $match: { messageId: currentId, active: true } },
            { $lookup: { from: "profiles", localField: "author", foreignField: "userId", as: "author" } },
            { $unwind: "$author" }
        ]).toArray()

        if (!results || results.length === 0) break
        chain.push(results[0])

        // Find the next message in the chain (one that has replyTo = currentId)
        const next = await messagesCollection.findOne({ replyTo: currentId, active: true })
        if (!next) break
        currentId = next.messageId
    }

    return chain
}

async function incrementReplyCount(messageId) {
    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    await messagesCollection.updateOne(
        { messageId: messageId },
        { $inc: { replyCount: 1 } }
    )
}

async function getAllUserMessagesWithAttachments(userId) {
    const database = await db.connectDatabase();
    const messagesCollection = database.collection("messages");
    return await messagesCollection.find({
        author: userId,
        "attachments.url": { $ne: "" }
    }).project({ attachments: 1, channelId: 1, messageId: 1 }).toArray();
}

async function deleteAllUserMessages(userId) {
    const database = await db.connectDatabase();
    const messagesCollection = database.collection("messages");
    await messagesCollection.deleteMany({ author: userId });
}

module.exports = { createMessage, getMessages, getMessage, setAttachment, setActive, editMessageBody, getUserMessages, getReplyChain, incrementReplyCount, getAllUserMessagesWithAttachments, deleteAllUserMessages }