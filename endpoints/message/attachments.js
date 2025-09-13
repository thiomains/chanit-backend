const messages = require("../../messages")
const snowflake = require("../../snowflake")

const AWS = require('aws-sdk');
const currentChannel = require("../../currentChannel");
const profiles = require("../../profiles");
const s3 = new AWS.S3({
    endpoint: process.env.S3_SERVER,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    s3ForcePathStyle: true,
});

async function post(req, res) {

    const message = await messages.getMessage(req.params.id)
    if (!message) {
        res.status(404).send({
            error: 'Message not found'
        });
        return
    }

    if (req.auth.user.id !== message.author.id) {
        res.status(403).send({
            error: 'You are not the author of this message'
        });
        return
    }

    const messageAttachments = message.attachments
    if (!messageAttachments) {
        res.status(400).send({
            error: 'No attachments to upload'
        });
        return
    }
    let attachmentIndex = -1
    for (let i = 0; i < messageAttachments.length; i++) {
        if (messageAttachments[i].url === "") {
            attachmentIndex = i
            break
        }
    }
    if (attachmentIndex === -1) {
        res.status(400).send({
            error: 'No attachments to upload'
        });
        return
    }

    if (!req.file) {
        res.status(400).send({
            error: 'No file sent'
        });
        return
    }

    const attachmentId = snowflake.generateId()

    const key = message.channelId + "/" + message.messageId + "/" + attachmentId + "/" + req.file.originalname

    const url = "https://cdn.faser.app/chanit/" + process.env.S3_ATTACHMENTS_BUCKET + "/" + key.replaceAll(" ", "%20")

    const attachment = {
        url: url,
        mimetype: req.file.mimetype,
        attachmentId: attachmentId,
        fileName: req.file.originalname,
        fileSize: req.file.size
    }

    await messages.setAttachment(message.messageId, attachmentIndex, attachment)

    res.status(203).send({
        fileUrl: url
    })

    const params = {
        Bucket: process.env.S3_ATTACHMENTS_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    };

    await s3.upload(params).promise();

    if (message.attachments.length !== attachmentIndex + 1) {
        return;
    }
    await messages.setActive(message.messageId, true)
    message.attachments[attachmentIndex] = attachment
    message.author = await profiles.getProfile(req.auth.user.id)
    currentChannel.sendToChannel(message.channelId, {
        type: "message",
        message: message
    })

}

module.exports = { post }