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
        deleted: false
    }

    await messagesCollection.insertOne(message)
    return message
}

async function getMessages(channelId, limit) {

    const documentLimit = limit || 50

    const database = await db.connectDatabase()
    const messagesCollection = database.collection("messages")
    return messagesCollection.find({
        channelId: channelId
    })
}

module.exports = { createMessage, getMessages }