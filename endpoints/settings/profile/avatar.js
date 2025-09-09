const profiles = require("../../../profiles")
const snowflake = require("../../../snowflake")

const sharp = require("sharp")

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    endpoint: process.env.S3_SERVER,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    s3ForcePathStyle: true,
});

async function post(req, res) {

    if (!req.file) {
        res.status(400).send({
            error: 'No file sent'
        });
        return
    }

    const fileBuffer = req.file.buffer

    const avatarId = snowflake.generateId()
    const userId = req.auth.user.id

    const processedBuffer = await sharp(fileBuffer)
        .resize(512, 512)
        .jpeg()
        .toBuffer();

    const key = "/" + userId + "/" + avatarId + ".jpg"

    const url = "https://cdn.faser.app/chanit/avatars" + key.replaceAll(" ", "%20")

    const params = {
        Bucket: "avatars",
        Key: key,
        Body: processedBuffer,
        ContentType: req.file.mimetype,
    };

    await s3.upload(params).promise();

    await profiles.updateProfilePictureUrl(userId, url)

    const profile = await profiles.getProfile(userId)

    res.status(200).send(profile)

}

async function remove(req, res) {
    const userId = req.auth.user.id
    await profiles.updateProfilePictureUrl(userId, "")


    res.status(200).send()
}

module.exports = { post, remove }