const bcrypt = require("bcrypt");
const users = require("../../../users");
const verificationCodes = require("../../../verificationCodes");
const mailSender = require("../../../mailSender");

async function handler(req, res) {
    const newEmail = req.body.newEmail;
    const password = req.body.password;

    if (!newEmail || !password) {
        res.status(400).send({
            error: "New email and password are required"
        });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        res.status(400).send({
            error: "Invalid email format"
        });
        return;
    }

    if (newEmail === req.auth.user.email) {
        res.status(400).send({
            error: "New email must be different from your current email"
        });
        return;
    }

    const passwordMatch = await bcrypt.compare(password, req.auth.user.password);
    if (!passwordMatch) {
        res.status(400).send({
            error: "Password is incorrect"
        });
        return;
    }

    const existingUser = await users.getUserByEmail(newEmail);
    if (existingUser) {
        res.status(409).send({
            error: "Email address is already in use"
        });
        return;
    }

    await verificationCodes.sendEmailChangeCode(req.auth.user.email, newEmail);

    await mailSender.sendEmail(
        req.auth.user.email,
        "A request to change your Chanit account email to " + newEmail + " was made. If you did not request this, your account may be compromised.",
        "Email change requested"
    );

    res.status(200).send({
        message: "Verification code sent to your current email address"
    });
}

module.exports = handler;
