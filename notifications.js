const db = require('./database')
const snowflake = require('./snowflake')
const { ws, sendMessage } = require("./events")

async function createNotification(userId, type, content) {
    const database = await db.connectDatabase();
    const notificationsCollection = database.collection("notifications");
    const notificationId = snowflake.generateId()
    const notification = {
        userId: userId,
        notificationId: notificationId,
        type: type,
        content: content,
        dismissed: false
    }
    await notificationsCollection.insertOne(notification)
    sendMessage(userId, {
        type: "notification",
        notification: notification
    })
}

async function getNotifications(userId) {
    const database = await db.connectDatabase();
    const notificationsCollection = database.collection("notifications");
    return await notificationsCollection.find({
        userId: userId,
        dismissed: false
    }).toArray()
}

async function getNotification(notificationId) {
    const database = await db.connectDatabase();
    const notificationsCollection = database.collection("notifications");
    return await notificationsCollection.findOne({
        notificationId: notificationId,
        dismissed: false
    })
}

async function setDismissed(notificationId, dismissed) {
    const database = await db.connectDatabase();
    const notificationsCollection = database.collection("notifications");
    await notificationsCollection.updateOne({
            notificationId: notificationId
        },
        {
            $set: {
                dismissed: dismissed
            }
        })
}

module.exports = { createNotification, getNotifications, setDismissed, getNotification }