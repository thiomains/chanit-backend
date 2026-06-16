const verificationCodes = require("../../../verificationCodes");

async function handler(req, res) {
    const code = req.body.code;

    if (!code) {
        res.status(400).send({
            error: "Verification code is required"
        });
        return;
    }

    const codeDoc = await verificationCodes.getCodeDocument(req.auth.user.email, code);
    if (!codeDoc) {
        res.status(400).send({
            error: "Invalid or expired verification code"
        });
        return;
    }

    if (!codeDoc.newEmail) {
        res.status(400).send({
            error: "No pending email change found"
        });
        return;
    }

    const newEmail = codeDoc.newEmail;

    await verificationCodes.consumeCode(req.auth.user.email, code);

    await verificationCodes.sendEmailChangeCode(newEmail, null);

    res.status(200).send({
        message: "Verification code sent to your new email address",
        newEmail: newEmail
    });
}

module.exports = handler;
