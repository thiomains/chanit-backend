const channels = require("../../channels")
const messages = require("../../messages")
const {createMessage} = require("../../messages");

async function get(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)
    if (!channel) {
        res.status(404).send({
            error: "Channel not found"
        })
        return
    }

    const channelMessages = await (await messages.getMessages(channelId)).toArray()
    
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

}

module.exports = { get, post }