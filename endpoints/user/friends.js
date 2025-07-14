const friends = require('../../friends')

// returns mutual friends of authenticated user
async function get(req, res) {

    const userId = req.params.id

    res.status(200).send(friends.getMutualFriends(userId, req.auth.user.id))

}

// creates or accepts a friend request to a specific user
async function post(req, res) {

    const userId = req.params.id
    if (userId === req.auth.user.id) {
        res.status(400).send({
            error: "You cannot add yourself as a friend"
        })
        return;
    }

    const alreadyFriends = await friends.getFriendship(req.auth.user.id, userId)
    if (alreadyFriends) {
        res.status(409).send({
            error: "You are already friends with that user"
        })
        return;
    }

    const alreadyRequested = await friends.getFriendRequest(req.auth.user.id, userId)
    if (alreadyRequested) {
        res.status(409).send({
            error: "You already sent a friend request to that user"
        })
        return;
    }

    const alreadyReceivedRequest = await friends.getFriendRequest(userId, req.auth.user.id)
    if (alreadyReceivedRequest) {
        await friends.removeFriendRequest(userId, req.auth.user.id)
        await friends.addFriends(userId, req.auth.user.id)
        res.status(200).send({
            message: "Friend request accepted"
        })
        return;
    }

    await friends.createFriendRequest(req.auth.user.id, userId)
    res.status(203).send({
        message: "Friend request sent",
    })

}

module.exports = { get, post }