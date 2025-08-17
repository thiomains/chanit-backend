const notifications = require("../../notifications")

async function get(req, res) {
    const documents = await notifications.getNotifications(req.auth.user.id)
    res.send(documents)
}

async function del(req, res) {
    const notificationId = req.params.id
    const notification = await notifications.getNotification(notificationId)
    if (!notification) {
        res.status(404).send({
            error: "Notification not found"
        })
        return
    }
    await notifications.setDismissed(notificationId, true)
    res.status(200).send({
        message: "Notification removed"
    })
}

module.exports = { get, del }