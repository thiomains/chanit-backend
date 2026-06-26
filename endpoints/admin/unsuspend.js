const users = require("../../users")
const adminProtocols = require("../../adminProtocols")

async function handler(req, res) {
    const userId = req.params.userId
    const reason = req.body.reason

    if (!reason || reason.length < 10) {
        res.status(400).send({ error: "Reason must be at least 10 characters" })
        return
    }

    const target = await users.getUserForAdmin(userId)
    if (!target) {
        res.status(404).send({ error: "User not found" })
        return
    }

    await users.setUserActive(userId, true)
    await adminProtocols.logAction(req.auth.user, userId, target.username, "unsuspendUser", reason, req.ip)

    res.status(200).send({ success: true, active: true })
}

module.exports = handler
