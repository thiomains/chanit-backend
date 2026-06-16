const bcrypt = require("bcrypt");
const users = require("../../../users");
const sessions = require("../../../sessions");
const mailSender = require("../../../mailSender");

async function handler(req, res) {
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    if (!currentPassword || !newPassword) {
        res.status(400).send({
            error: "Current password and new password are required"
        });
        return;
    }

    if (newPassword.length < 8) {
        res.status(400).send({
            error: "New password must be at least 8 characters"
        });
        return;
    }

    const passwordMatch = await bcrypt.compare(currentPassword, req.auth.user.password);
    if (!passwordMatch) {
        res.status(400).send({
            error: "Current password is incorrect"
        });
        return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await users.updatePassword(req.auth.user.id, passwordHash);

    const userSessions = await sessions.getSessions(req.auth.user.id);
    for (const session of userSessions) {
        if (session.sessionId !== req.auth.session.sessionId) {
            await sessions.invalidateSessionById(session.sessionId);
        }
    }

    await mailSender.sendEmail(
        req.auth.user.email,
        "Your Chanit password has been changed. If you did not make this change, please contact support immediately.",
        "Password changed"
    );

    res.status(200).send({
        message: "Password changed successfully. All sessions have been invalidated."
    });
}

module.exports = handler;
