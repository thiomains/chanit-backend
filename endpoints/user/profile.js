const profiles = require("../../profiles")

async function get(req, res) {
    const userId = req.params.id;
    const profile = await profiles.getProfile(userId)
    if (!profile) {
        res.status(404).send({
            error: "User profile not found"
        })
        return
    }
    res.status(200).send(profile)
}

module.exports = { get }