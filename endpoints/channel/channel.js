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

    res.status(200).send(channel)
}

module.exports = { get }