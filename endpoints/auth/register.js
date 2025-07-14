const db = require("../../database");
const bcrypt = require("bcrypt");
const snowflake = require("../../snowflake");
const sessions = require("../../sessions");

async function register(req, res) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    if (!req.body.username || !req.body.email || !req.body.password) {
        res.status(400).send({
            error: "Bad request"
        });
        return;
    }

    const checkIfEmailIsTaken = await usersCollection.findOne({email: req.body.email});
    if (checkIfEmailIsTaken) {
        res.status(409).send({
            error: "Email is already taken"
        });
        return;
    }

    const checkIfUsernameIsTaken = await usersCollection.findOne({username: req.body.username});
    if (checkIfUsernameIsTaken) {
        res.status(409).send({
            error: "Username is already taken"
        });
        return;
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const user = {
        id: snowflake.generateId(),
        username: req.body.username,
        email: req.body.email,
        password: passwordHash,
        createdAt: Date.now(),
        active: true,
        profile: {}
    }

    await usersCollection.insertOne(user);

    const session = await sessions.createSession(user.id, req.headers["user-agent"], req.ip);
    sessions.setSessionCookieAndSend(res, session, 201, {
        message: "Account created successfully"
    });
}

module.exports = register;