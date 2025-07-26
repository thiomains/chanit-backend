const channels = require("../../channels")

async function get(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)

    console.log(channel)
}

module.exports = { get }