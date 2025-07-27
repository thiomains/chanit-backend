const db = require('./database')
const snowflake = require('./snowflake')

async function createMessage(author, body) {
    const database = await db.connectDatabase();
    const messagesCollection = database.collection("messages");
    const message = {
        messageId: snowflake.generateId(),
        createdAt: Date.now(),
        author: author,
        body: body
    }

    await messagesCollection.insertOne(message)
    return message
}

module.exports = { createMessage }