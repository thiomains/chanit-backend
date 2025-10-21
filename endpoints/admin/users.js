const users = require("../../users")

async function get(req, res) {
    const allUsers = await users.getAllUsers()
    res.send(allUsers)
}

module.exports = { get }