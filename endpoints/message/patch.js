const messages = require("../../messages")
const currentChannel = require("../../currentChannel")

async function patch(req, res) {
    const message = await messages.getMessage(req.params.id)

    console.log(message)

    if (!req.body.body || req.body.body === "") {
        res.status(400).send({
            error: 'Body cannot be empty'
        });
        return
    }

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

    console.log(req.body.body)

    await messages.editMessageBody(message.messageId, req.body.body)

    res.status(200).send({
        message: "Message edited"
    })

    currentChannel.sendToChannel(message.channelId, {
        type: "message-edit",
        messageId: message.messageId,
        body: req.body.body
    })
}

module.exports = { patch }