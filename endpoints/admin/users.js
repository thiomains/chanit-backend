const users = require("../../users")
const profiles = require("../../profiles")
const friends = require("../../friends")
const sessions = require("../../sessions")

async function get(req, res) {
    const userId = req.query.userId
    if (!userId) {
        const allUsers = await users.getAllUsers()
        res.send(allUsers)
        return
    }
    const user = await users.getUser(userId)
    const userProfile = await profiles.getProfile(userId)
    const userFriends = await friends.getFriends(userId)
    const userSessions = await sessions.getSessions(userId)
    user.profile = userProfile
    user.friends = userFriends
    user.sessions = userSessions

    delete user.password

    res.send(user)
}

module.exports = { get }