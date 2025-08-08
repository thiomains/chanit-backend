const profiles = require('./../../profiles')

async function me(req, res) {

    const profile = await profiles.getProfile(req.auth.user.id)

    res.status(200).send(profile);

}

module.exports = me;