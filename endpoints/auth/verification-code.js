const db = require("../../database");
const verificationCodes = require("../../verificationCodes")
const users = require("../../users")

async function verify(req, res) {
    if (req.auth.user.emailVerified) {
        res.status(409).send({
            error: "Account e-mail address already verified"
        })
        return
    }
    const code = req.body.code
    if (!code) {
        res.status(400).send({
            error: "Bad Request"
        })
        return
    }
    if (!await verificationCodes.isValid(req.auth.user.email, code)) {
        res.status(400).send({
            error: "Verification code is invalid or expired"
        })
        return
    }
    await users.setUserVerified(req.auth.user.id, true)
    res.status(200).send({
        message: "Account e-mail address verified"
    })
}

async function send(req, res) {
    if (req.auth.user.emailVerified) {
        res.status(409).send({
            error: "Account e-mail address already verified"
        })
        return
    }
    await verificationCodes.sendVerificationCode(req.auth.user.email)
    res.status(200).send({
        message: "Verification code sent to " + req.auth.user.email
    })
}

module.exports = { verify, send }