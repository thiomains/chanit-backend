const users = require("../../users")
const profiles = require("../../profiles")
const friends = require("../../friends")

async function get(req, res) {
    const userId = req.query.userId
    if (!userId) {
        const allUsers = await users.getAllUsers()
        res.send(allUsers)
        return
    }
    const user = await users.getUserForAdmin(userId)
    if (!user) {
        res.status(404).send({ error: "User not found" })
        return
    }
    const userProfile = await profiles.getProfile(userId)
    const friendCount = await friends.getFriendCount(userId)
    delete user.password
    res.send({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        active: user.active,
        emailVerified: user.emailVerified,
        faserId: user.faserId,
        profile: userProfile ? {
            userId: userProfile.userId,
            username: userProfile.username,
            profilePictureUrl: userProfile.profilePictureUrl,
            bio: userProfile.bio,
            createdAt: userProfile.createdAt
        } : null,
        friendCount
    })
}

module.exports = { get }