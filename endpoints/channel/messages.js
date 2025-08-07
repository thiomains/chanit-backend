const channels = require("../../channels")
const messages = require("../../messages")
const {createMessage} = require("../../messages");
const currentChannel = require("../../currentChannel")
const users = require("../../users")

async function get(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)
    if (!channel) {
        res.status(404).send({
            error: "Channel not found"
        })
        return
    }

    if (!await channels.hasChannelAccess(req.auth.user.id, channel)) {
        res.status(403).send({
            error: "You are not permitted to access messages of this channel"
        })
        return
    }

    let before = parseInt(req.query.before) ? parseInt(req.query.before) : Date.now()
    let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 50

    const channelMessages = await messages.getMessages(channelId, before, limit)
    
    res.status(200).send(channelMessages)
}

async function post(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)
    if (!channel) {
        res.status(404).send({
            error: "Channel not found"
        })
        return
    }

    let attachments = req.body.attachmentCount
    if (!attachments) attachments = 0

    const message = await messages.createMessage(channelId, req.auth.user.id, req.body.body, attachments)

    res.status(201).send(message)

    await channels.setLastMessage(channelId, message)

    message.author = await users.getPublicUser(req.auth.user.id)

    if (message.attachments.length === 0) {
        currentChannel.sendToChannel(channelId, {
            type: "message",
            message: message
        })
    }

}

module.exports = { get, post }