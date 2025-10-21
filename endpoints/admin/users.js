const users = require("../../users")
const globalPermissions = require("../../globalPermissions")

async function get(req, res) {
    const allUsers = await users.getAllUsers()
    res.send(allUsers)
}

module.exports = { get }