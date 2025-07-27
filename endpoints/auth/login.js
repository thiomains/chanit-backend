const db = require("../../database");
const bcrypt = require("bcrypt");
const sessions = require("../../sessions");

async function login(req, res) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    if (!req.body.email || !req.body.password) {
        res.status(400).send({
            error: "Bad request"
        });
        return;
    }

    const user = await usersCollection.findOne({email: req.body.email});
    if (!user) {
        res.status(400).send({
            error: "Invalid email or password"
        });
        return;
    }

    const passwordValid = await bcrypt.compare(req.body.password, user.password);
    if (!passwordValid) {
        res.status(400).send({
            error: "Invalid email or password"
        });
        return;
    }

    const session = await sessions.createSession(user.id, req.headers["user-agent"], req.ip);
    sessions.setSessionCookieAndSend(res, session, 200, {
        message: "Logged in successfully"
    });
}

module.exports = login;