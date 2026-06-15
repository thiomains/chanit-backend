const messages = require("../../messages")

async function get(req, res) {
    const messageId = req.params.id

    const message = await messages.getMessage(messageId)
    if (!message) {
        res.status(404).send({ error: "Message not found" })
        return
    }

    const chain = await messages.getReplyChain(messageId)
    res.status(200).send(chain)
}

module.exports = { get }
