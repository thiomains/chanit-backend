const sessions = require("../../sessions");

async function post(req, res) {

    if (!req.cookies.session) {
        res.status(404).send({
            error: "Not logged in"
        })
        return;
    }

    await sessions.invalidateSessionById(req.cookies.session.sessionId);
    res.status(200).send({
        message: "Logged out successfully"
    });
}

module.exports = post;