const channels = require("../../channels")

async function get(req, res) {
    const userId = req.auth.user.id

    const recentChannels = await channels.getRecentDirectChannels(userId)

    res.status(200).send(recentChannels)
}

module.exports = { get }