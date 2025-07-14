const db = require('./database')

async function getMutualFriends(otherUserId, selfUserId) {
    // TODO
}

async function getFriends(userId) {
    const database = await db.connectDatabase();
    const friendsCollection = database.collection("friends");

    return await friendsCollection.find({
        users: {
            $all: [userId]
        }
    }).toArray();
}

async function getIncomingFriendRequests(userId) {
    const database = await db.connectDatabase();
    const friendRequestsCollection = database.collection("friendRequests");

    return await friendRequestsCollection.find({
        recipient: userId
    }).toArray()
}

async function getOutgoingFriendRequests(userId) {
    const database = await db.connectDatabase();
    const friendRequestsCollection = database.collection("friendRequests");

    return await friendRequestsCollection.find({
        sender: userId
    }).toArray()
}

async function getFriendRequest(userId, otherUserId) {
    const database = await db.connectDatabase();
    const friendRequestsCollection = database.collection("friendRequests");

    return await friendRequestsCollection.findOne({
        sender: userId,
        recipient: otherUserId
    })
}

async function createFriendRequest(senderUserId, recipientUserId) {
    const database = await db.connectDatabase();
    const friendRequestsCollection = database.collection("friendRequests");

    const friendRequest = {
        sender: senderUserId,
        recipient: recipientUserId,
        createdAt: Date.now()
    }

    await friendRequestsCollection.insertOne(friendRequest)
}

async function addFriends(userId, otherUserId){
    const database = await db.connectDatabase();
    const friendsCollection = database.collection("friends");

    const friends = {
        users: [
            userId,
            otherUserId
        ],
        friendsSince: Date.now()
    }

    await friendsCollection.insertOne(friends)
}

async function removeFriendRequest(userId, otherUserId) {
    const database = await db.connectDatabase();
    const friendRequestsCollection = database.collection("friendRequests");

    await friendRequestsCollection.deleteOne({
        sender: userId,
        recipient: otherUserId,
    })
}

async function getFriendship(userId, otherUserId) {
    const database = await db.connectDatabase();
    const friendsCollection = database.collection("friends");

    return await friendsCollection.findOne({
        users: {
            $all: [ userId, otherUserId ]
        }
    })
}

module.exports = { getMutualFriends, createFriendRequest, getIncomingFriendRequests, getOutgoingFriendRequests, getFriends, addFriends, removeFriendRequest, getFriendship, getFriendRequest };