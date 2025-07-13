const sessions = require("../../sessions");

async function me(req, res) {

    res.status(200).send({
        userId: req.auth.user.id,
        username: req.auth.user.username,
        email: req.auth.user.email,
        createdAt: req.auth.user.createdAt,
    });

}

module.exports = me;