const users = require("../../../users");
const verificationCodes = require("../../../verificationCodes");
const mailSender = require("../../../mailSender");

async function handler(req, res) {
    const code = req.body.code;
    const newEmail = req.body.newEmail;

    if (!code || !newEmail) {
        res.status(400).send({
            error: "Verification code and new email are required"
        });
        return;
    }

    const codeDoc = await verificationCodes.getCodeDocument(newEmail, code);
    if (!codeDoc) {
        res.status(400).send({
            error: "Invalid or expired verification code"
        });
        return;
    }

    await verificationCodes.consumeCode(newEmail, code);

    const oldEmail = req.auth.user.email;
    await users.updateEmail(req.auth.user.id, newEmail);

    await mailSender.sendEmail(
        oldEmail,
        "Your Chanit account email has been changed to " + newEmail + ". If you did not make this change, please contact support immediately.",
        "Email address changed"
    );

    await mailSender.sendEmail(
        newEmail,
        "Your email address has been set as the login email for your Chanit account.",
        "Email address set"
    );

    res.status(200).send({
        message: "Email address changed successfully"
    });
}

module.exports = handler;
