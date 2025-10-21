const globalPermissions = require("../../globalPermissions")

async function get(req, res) {
    const perms = await globalPermissions.getPermissions(req.auth.user.id)
    res.send(perms)
}

module.exports = { get }