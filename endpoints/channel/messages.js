const channels = require("../../channels")
const messages = require("../../messages")

async function get(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)
    if (!channel) {
        res.status(404).send({
            error: "Channel not found"
        })
        return
    }
    

    console.log(channel)
}

async function post(req, res) {
    const channelId = req.params.id;
    const channel = await channels.getChannel(channelId)


}

module.exports = { get }