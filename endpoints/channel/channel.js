const channels = require("../../channels")

async function get(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)

    if (!channel) {
        res.status(404).send({
            error: "Channel not found"
        })
        return;
    }

    if (!await channels.hasChannelAccess(req.auth.user.id, channel)) {
        res.status(403).send({
            error: "You are not permitted to access this channel"
        })
        return
    }

    res.status(200).send(channel)
}

module.exports = { get }