const friends = require('../../../friends')

async function get(req, res) {
    const userId = req.auth.user.id

    const friendRequestsOut = await friends.getOutgoingFriendRequests(userId)
    const friendRequestsIn = await friends.getIncomingFriendRequests(userId)

    const friendRequests = {
        in: friendRequestsIn,
        out: friendRequestsOut
    }

    res.status(200).send(friendRequests)

}

module.exports = { get }
