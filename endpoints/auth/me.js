const profiles = require('./../../profiles')
const users = require('../../users')

async function me(req, res) {

    const profile = await profiles.getProfile(req.auth.user.id)
    const user = await users.getUser(req.auth.user.id)
    profile.loginName = user.username

    res.status(200).send(profile);

}

module.exports = me;