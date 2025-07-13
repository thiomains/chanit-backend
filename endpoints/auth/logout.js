const sessions = require("../../sessions");

async function register(req, res) {
    await sessions.invalidateSessionById(req.cookies.session.sessionId);
    res.status(200).send("Logged out successfully");
}

module.exports = register;