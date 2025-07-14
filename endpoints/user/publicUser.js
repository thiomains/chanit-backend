const users = require('../../users')

async function publicUser(req, res) {

    const userId = req.params.id;

    const user = await users.getPublicUser(userId)

    if (user == null) {
        res.status(404).send({
            error: "User not found"
        })
        return;
    }

    res.status(200).send(user)

}

module.exports = publicUser;