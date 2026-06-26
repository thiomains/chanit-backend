const users = require("../../users");
const adminProtocols = require("../../adminProtocols");

async function post(req, res) {
    const { targetUserId, action, reason } = req.body;
    if (!targetUserId || !action || !reason) {
        res.status(400).send({ error: "targetUserId, action, and reason are required" });
        return;
    }
    if (reason.length < 10) {
        res.status(400).send({ error: "Reason must be at least 10 characters" });
        return;
    }
    const target = await users.getUserForAdmin(targetUserId);
    if (!target) {
        res.status(404).send({ error: "Target user not found" });
        return;
    }
    await adminProtocols.logAction(req.auth.user, targetUserId, target.username, action, reason, req.ip);
    res.status(201).send({ success: true });
}

module.exports = { post };
