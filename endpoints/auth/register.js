const db = require("../../database");
const bcrypt = require("bcrypt");
const snowflake = require("../../snowflake");
const sessions = require("../../sessions");
const users = require('../../users')

async function register(req, res) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    if (!req.body.username || !req.body.email || !req.body.password) {
        res.status(400).send({
            error: "Bad request"
        });
        return;
    }

    if (req.body.username.length > 16) {
        res.status(400).send({
            error: "Username cannot exceed 16 characters"
        })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!req.body.email.match(emailRegex)) {
        res.status(400).send({
            error: "Invalid email address"
        })
        return;
    }

    const checkIfEmailIsTaken = await users.getUserByEmail(req.body.email)
    if (checkIfEmailIsTaken) {
        res.status(409).send({
            error: "Email is already taken"
        });
        return;
    }

    const checkIfUsernameIsTaken = await users.getUserByName(req.body.username)
    if (checkIfUsernameIsTaken) {
        res.status(409).send({
            error: "Username is already taken"
        });
        return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!req.body.password.match(passwordRegex)) {
        res.status(400).send({
            error: "Password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
        })
        return;
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const user = await users.createAccount(req.body.username, req.body.email, passwordHash)

    const session = await sessions.createSession(user.id, req.headers["user-agent"], req.ip);
    sessions.setSessionCookieAndSend(res, session, 201, {
        message: "Account created successfully"
    });
}

module.exports = register;