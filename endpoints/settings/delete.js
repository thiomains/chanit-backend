const bcrypt = require("bcrypt");
const users = require("../../users");
const messages = require("../../messages");
const friends = require("../../friends");
const verificationCodes = require("../../verificationCodes");
const sessions = require("../../sessions");
const profiles = require("../../profiles");
const mailSender = require("../../mailSender");
const db = require("../../database");

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    endpoint: process.env.S3_SERVER,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    s3ForcePathStyle: true,
});

async function request(req, res) {
    const password = req.body.password;

    if (!password) {
        res.status(400).send({
            error: "Password is required"
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

    await verificationCodes.sendVerificationCode(req.auth.user.email);

    res.status(200).send({
        message: "Verification code sent to your email"
    });
}

async function confirm(req, res) {
    const password = req.body.password;
    const code = req.body.code;

    if (!password || !code) {
        res.status(400).send({
            error: "Password and verification code are required"
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

    const codeValid = await verificationCodes.isValid(req.auth.user.email, code);
    if (!codeValid) {
        res.status(400).send({
            error: "Invalid or expired verification code"
        });
        return;
    }

    const userId = req.auth.user.id;
    const email = req.auth.user.email;

    // S3 cleanup - Message attachments
    try {
        const userMessages = await messages.getAllUserMessagesWithAttachments(userId);
        for (const msg of userMessages) {
            for (const attachment of msg.attachments) {
                if (attachment.url && attachment.url !== "") {
                    const key = attachment.url.replace("https://cdn.faser.app/chanit/attachments/", "").replace(/%20/g, " ");
                    try {
                        await s3.deleteObject({
                            Bucket: process.env.S3_ATTACHMENTS_BUCKET,
                            Key: key
                        }).promise();
                    } catch (e) {
                        // S3 delete error, continue with deletion
                    }
                }
            }
        }
    } catch (e) {
        // Continue with deletion even if S3 cleanup fails
    }

    // S3 cleanup - Avatar
    try {
        const profile = await profiles.getProfile(userId);
        if (profile && profile.profilePictureUrl && profile.profilePictureUrl.startsWith("https://cdn.faser.app/chanit/avatars/")) {
            const key = profile.profilePictureUrl.replace("https://cdn.faser.app/chanit/avatars/", "").replace(/%20/g, " ");
            try {
                await s3.deleteObject({
                    Bucket: process.env.S3_AVATARS_BUCKET,
                    Key: key
                }).promise();
            } catch (e) {
                // S3 delete error, continue with deletion
            }
        }
    } catch (e) {
        // Continue with deletion even if S3 cleanup fails
    }

    await messages.deleteAllUserMessages(userId);

    const database = await db.connectDatabase();

    // Delete notifications
    const notificationsCollection = database.collection("notifications");
    await notificationsCollection.deleteMany({ userId: userId });

    // Delete friend requests
    await friends.removeAllFriendRequests(userId);

    // Delete friend relations
    await friends.removeAllFriendRelations(userId);

    // Delete direct message channels where user is a member
    const channelsCollection = database.collection("channels");
    await channelsCollection.deleteMany({
        channelType: "direct-message",
        "directMessageChannel.members": userId
    });

    // Delete profile
    const profilesCollection = database.collection("profiles");
    await profilesCollection.deleteOne({ userId: userId });

    // Delete all sessions
    const sessionsCollection = database.collection("sessions");
    await sessionsCollection.deleteMany({ userId: userId });

    // Delete all verification codes
    await verificationCodes.deleteUserCodes(email);

    // Delete user
    await users.deleteUser(userId);

    await mailSender.sendEmail(
        email,
        "Your Chanit account has been permanently deleted. All your data has been removed.",
        "Account deleted"
    );

    res.status(200).send({
        message: "Account deleted successfully"
    });
}

module.exports = { request, confirm };
