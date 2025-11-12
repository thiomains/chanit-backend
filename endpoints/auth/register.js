const db = require("../../database");
const bcrypt = require("bcrypt");
const snowflake = require("../../snowflake");
const sessions = require("../../sessions");
const users = require('../../users')
const profiles = require("../../profiles");
const verificationCodes = require("../../verificationCodes")

async function register(req, res) {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    if (!req.body.username || !req.body.email || !req.body.password) {
        res.status(400).send({
            error: "Bad request"
        });
        return;
    }

    const lowercaseUsername = req.body.username.toLowerCase()
    const usernameRegex = /^[a-z][0-9a-z_.]{2,23}$/
    if (!lowercaseUsername.match(usernameRegex)) {
        res.status(400).send({
            error: "Username must be 3–24 characters long, start with a letter, and may contain letters, numbers, dots (.), dashes (-), and underscores (_)."
        })
        return;
    }

    let email = req.body.email
    email = email.toLowerCase()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.match(emailRegex)) {
        res.status(400).send({
            error: "Invalid email address"
        })
        return;
    }

    const checkIfEmailIsTaken = await users.getUserByEmail(email)
    if (checkIfEmailIsTaken) {
        res.status(409).send({
            error: "Email is already taken"
        });
        return;
    }

    const checkIfUsernameIsTaken = await users.getUserByName(lowercaseUsername)
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

    const user = await users.createAccount(lowercaseUsername, email, passwordHash)

    const session = await sessions.createSession(user.id, req.headers["user-agent"], req.ip);
    sessions.setSessionCookieAndSend(res, session, 201, {
        message: "Account created successfully"
    });

    await profiles.createProfile(user)

    await verificationCodes.sendVerificationCode(email)
}

module.exports = register;
