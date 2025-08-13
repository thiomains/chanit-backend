const profiles = require("../../../profiles")

async function post(req, res) {
    const userId = req.auth.user.id
    const newUsername = req.body.username
    const newBio = req.body.bio
    if (!(newBio || newUsername)) {
        res.status(400).send({
            error: "Bad Request"
        })
        return
    }
    if (newBio) await profiles.updateBio(userId, newBio)
    if (newUsername) {
        await profiles.updateUsername(userId, newUsername)
    }

    const profile = await profiles.getProfile(userId)
    res.status(200).send(profile)
}

module.exports = { post }