const db = require('./database')
const users = require('./users')
const directChannels = require('./channels')

async function getMutualFriends(otherUserId, selfUserId) {
    // TODO
}

async function getFriendships(userId) {
    const database = await db.connectDatabase();
    const friendsCollection = database.collection("friends");

    return await friendsCollection.find({
        users: {
            $all: [userId]
        }
    }).toArray();
}

async function getFriends(userId) {
    const friendships = await getFriendships(userId);

    let friends = []

    for (let i = 0; i < friendships.length; i++) {
        let friendship = friendships[i];
        friendship.users = friendship.users.filter(item => item !== userId);
        const friend = {
            user: await users.getPublicUser(friendship.users[0]),
            friendsSince: friendship.friendsSince,
            directChannelId: friendship.directChannelId
        }
        friends.push(friend)
    }

    return friends
}

async function getIncomingFriendRequests(userId) {
    const database = await db.connectDatabase();
    const friendRequestsCollection = database.collection("friendRequests");

    return await friendRequestsCollection.aggregate([
        {
            $match: {
                recipient: userId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "recipient",
                foreignField: "id",
                as: "recipientUser"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "id",
                as: "senderUser"
            }
        },
        { $unwind: "$recipientUser" },
        { $unwind: "$senderUser" },
        {
            $project: {
                _id: 0,
                createdAt: 1,
                recipient: {
                    userId: "$recipientUser.id",
                    username: "$recipientUser.username",
                    createdAt: "$recipientUser.createdAt"
                },
                sender: {
                    userId: "$senderUser.id",
                    username: "$senderUser.username",
                    createdAt: "$senderUser.createdAt"
                }
            }
        }
    ]).toArray();

}

async function getOutgoingFriendRequests(userId) {
    const database = await db.connectDatabase();
    const friendRequestsCollection = database.collection("friendRequests");

    return await friendRequestsCollection.aggregate([
        {
            $match: {
                sender: userId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "recipient",
                foreignField: "id",
                as: "recipientUser"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "id",
                as: "senderUser"
            }
        },
        { $unwind: "$recipientUser" },
        { $unwind: "$senderUser" },
        {
            $project: {
                _id: 0,
                createdAt: 1,
                recipient: {
                    userId: "$recipientUser.id",
                    username: "$recipientUser.username",
                    createdAt: "$recipientUser.createdAt"
                },
                sender: {
                    userId: "$senderUser.id",
                    username: "$senderUser.username",
                    createdAt: "$senderUser.createdAt"
                }
            }
        }
    ]).toArray();
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

    const directChannel = await directChannels.createDirectChannel(friends)
    friends.directChannelId = directChannel.channelId

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

module.exports = { getMutualFriends, createFriendRequest, getIncomingFriendRequests, getOutgoingFriendRequests, getFriendships, addFriends, removeFriendRequest, getFriendship, getFriendRequest, getFriends };