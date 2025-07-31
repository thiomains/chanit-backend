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

    const channelMessages = await messages.getMessages(channelId)
    
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

    const message = await messages.createMessage(channelId, req.auth.user.id, req.body.body)

    res.status(201).send(message)

    channels.setLastMessage(channelId, message)

    message.author = await users.getPublicUser(req.auth.user.id)

    currentChannel.sendToChannel(channelId, {
        type: "message",
        message: message
    })

}

module.exports = { get, post }