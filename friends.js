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
    const database = await db.connectDatabase();
    const friendsCollection = database.collection("friends");
    const friends = await friendsCollection.aggregate([
        {
            $match: {
                users: userId
            }
        },
        {
            $addFields: {
                friendId: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$users",
                                as: "id",
                                cond: { $ne: ["$$id", userId] }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $lookup: {
                from: "profiles",            // statt "users"
                localField: "friendId",      // ID aus dem aktuellen Dokument
                foreignField: "userId",      // Feld in profiles mit userId
                as: "profile"
            }
        },
        { $unwind: "$profile" },
        {
            $project: {
                _id: 0,
                friendsSince: 1,
                directChannelId: 1,
                user: "$profile"             // direkt das Profil-Dokument einsetzen
            }
        }
    ]).toArray();

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
                from: "profiles",
                localField: "recipient",
                foreignField: "userId",
                as: "recipientUser"
            }
        },
        {
            $lookup: {
                from: "profiles",
                localField: "sender",
                foreignField: "userId",
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
                    userId: "$recipientUser.userId",
                    username: "$recipientUser.username",
                    profilePictureUrl: "$recipientUser.profilePictureUrl",
                    bio: "$recipientUser.bio",
                    createdAt: "$recipientUser.createdAt"
                },
                sender: {
                    userId: "$senderUser.userId",
                    username: "$senderUser.username",
                    profilePictureUrl: "$senderUser.profilePictureUrl",
                    bio: "$senderUser.bio",
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
                from: "profiles",
                localField: "recipient",
                foreignField: "userId",
                as: "recipientUser"
            }
        },
        {
            $lookup: {
                from: "profiles",
                localField: "sender",
                foreignField: "userId",
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
                    userId: "$recipientUser.userId",
                    username: "$recipientUser.username",
                    profilePictureUrl: "$recipientUser.profilePictureUrl",
                    bio: "$recipientUser.bio",
                    createdAt: "$recipientUser.createdAt"
                },
                sender: {
                    userId: "$senderUser.userId",
                    username: "$senderUser.username",
                    profilePictureUrl: "$senderUser.profilePictureUrl",
                    bio: "$senderUser.bio",
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

    const directChannel = await directChannels.getFriendDirectChannel(friends)
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

async function removeFriends(userId, otherUserId) {
    const database = await db.connectDatabase();
    const friendsCollection = database.collection("friends");
    await friendsCollection.deleteOne({
        users: { $all: [userId, otherUserId] }
    })
}

async function removeAllFriendRelations(userId) {
    const database = await db.connectDatabase();
    const friendsCollection = database.collection("friends");
    await friendsCollection.deleteMany({ users: userId });
}

async function removeAllFriendRequests(userId) {
    const database = await db.connectDatabase();
    const friendRequestsCollection = database.collection("friendRequests");
    await friendRequestsCollection.deleteMany({
        $or: [{ sender: userId }, { recipient: userId }]
    });
}

async function getFriendCount(userId) {
    const friendships = await getFriendships(userId);
    return friendships.length;
}

async function getFriendRequestStatus(userId) {
    const [incoming, outgoing] = await Promise.all([getIncomingFriendRequests(userId), getOutgoingFriendRequests(userId)]);
    return { incoming: incoming.length, outgoing: outgoing.length };
}

module.exports = { getMutualFriends, createFriendRequest, getIncomingFriendRequests, getOutgoingFriendRequests, getFriendships, addFriends, removeFriendRequest, getFriendship, getFriendRequest, getFriends, removeFriends, removeAllFriendRelations, removeAllFriendRequests, getFriendCount, getFriendRequestStatus };