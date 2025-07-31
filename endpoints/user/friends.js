const friends = require('../../friends')
const users = require('../../users')

async function get(req, res) {

    const userId = req.params.id
    if (userId === req.auth.user.id || userId === "me") {
        res.status(200).send(await friends.getFriends(req.auth.user.id))
        return;
    }

    res.status(200).send(await friends.getMutualFriends(userId, req.auth.user.id))

}

// creates or accepts a friend request to a specific user
async function post(req, res) {

    let userId = req.params.id

    if (userId.length <= 16) {
        const user = await users.getUserByName(userId)
        if (!user) {
            res.status(404).send({
                error: "User not found"
            })
            return;
        }
        userId = user.id
    }

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

async function remove(req, res) {
    const userId = req.auth.user.id
    const friendUserId = req.params.id
    if (userId === friendUserId) {
        res.status(400).send({
            error: "You cannot remove yourself as a friend"
        })
        return;
    }
    const alreadyRequested = await friends.getFriendRequest(userId, friendUserId)
    if (alreadyRequested) {
        await friends.removeFriendRequest(userId, friendUserId)
        res.status(204).send({
            message: "Cancelled friend request"
        })
        return;
    }
    const receivedRequest = await friends.getFriendRequest(friendUserId, userId)
    if (receivedRequest) {
        await friends.removeFriendRequest(friendUserId, userId)
        res.status(204).send({
            message: "Declined friend request"
        })
    }
    const alreadyFriends = await friends.getFriendship(userId, friendUserId)
    if (alreadyFriends) {
        await friends.removeFriends(userId, friendUserId)
        res.status(204).send({
            message: "Removed friend"
        })
        return;
    }
    res.status(404).send({
        error: "No friendship or pending friend request exists with this user"
    })
}

module.exports = { get, post, remove }