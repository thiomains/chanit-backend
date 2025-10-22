const messages = require("../../messages")
const currentChannel = require("../../currentChannel")

async function del(req, res) {
    const message = await messages.getMessage(req.params.id)

    if (!message) {
        res.status(404).send({
            error: 'Message not found'
        });
        return
    }

    if (!message.active) {
        res.status(404).send({
            error: 'Message not found'
        });
        return
    }

    if (req.auth.user.id !== message.author.id) {
        res.status(403).send({
            error: 'You are not the author of this message'
        });
        return
    }

    await messages.setActive(message.messageId, false)

    res.status(200).send({
        message: "Message deleted"
    })

    currentChannel.sendToChannel(message.channelId, {
        type: "message-delete",
        messageId: message.messageId
    })
}

module.exports = { del }