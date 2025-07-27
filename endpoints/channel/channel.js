const channels = require("../../channels")

async function get(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)

    if (!channel) {
        res.status(400).send({
            error: "Channel not found"
        })
    }

    res.status(200).send({
        channel
    })
}

module.exports = { get }