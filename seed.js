const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const db = require('./database');
const snowflake = require('./snowflake');

const SEED_COUNT = 20;
const FRIENDS_MIN = 3;
const FRIENDS_MAX = 8;
const MESSAGES_MIN = 5;
const MESSAGES_MAX = 30;
const SEED_PASSWORD = 'Seed1234!';

async function seedIfEmpty() {
    const database = await db.connectDatabase();
    const usersCollection = database.collection("users");

    const userCount = await usersCollection.countDocuments();
    if (userCount > 0) {
        console.log("[seed] Users already exist, skipping seed.");
        return;
    }

    console.log("[seed] DEV_MODE enabled, no users found. Seeding 20 random users...");

    const users = await seedUsers(database);
    const channels = await seedFriendships(database, users);
    await seedMessages(database, users, channels);

    console.log("[seed] Done! Created 20 users with friendships and chats.");
}

function generateUsers() {
    const passwordHash = bcrypt.hashSync(SEED_PASSWORD, 10);
    const users = [];

    for (let i = 0; i < SEED_COUNT; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const username = faker.internet.username({ firstName, lastName })
            .toLowerCase()
            .replace(/[^a-z0-9_.]/g, '')
            .substring(0, 24);

        users.push({
            id: snowflake.generateId(),
            username: username,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: passwordHash,
            createdAt: Date.now(),
            active: true,
            emailVerified: true,
        });
    }

    return users;
}

function generateFriendships(users) {
    const friendships = [];
    const userIds = users.map(u => u.id);
    const friendCounts = new Map(userIds.map(id => [id, 0]));

    for (const user of userIds) {
        const targetCount = faker.number.int({ min: FRIENDS_MIN, max: FRIENDS_MAX });
        const currentCount = friendCounts.get(user);
        const needed = targetCount - currentCount;

        if (needed <= 0) continue;

        const existing = new Set(
            friendships
                .filter(f => f.users.includes(user))
                .flatMap(f => f.users)
        );
        existing.add(user);

        const candidates = userIds.filter(id => !existing.has(id));
        const shuffled = faker.helpers.shuffle(candidates);

        for (let j = 0; j < Math.min(needed, shuffled.length); j++) {
            const friend = shuffled[j];
            const pair = [user, friend].sort();
            friendships.push({
                users: pair,
                friendsSince: Date.now() - faker.number.int({
                    min: 0,
                    max: 30 * 24 * 60 * 60 * 1000
                }),
            });
            friendCounts.set(user, friendCounts.get(user) + 1);
            friendCounts.set(friend, friendCounts.get(friend) + 1);
        }
    }

    // Deduplicate by sorted user pair
    const seen = new Set();
    return friendships.filter(f => {
        const key = f.users.join(':');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function generateMessages(channelId, userA, userB, count) {
    const messages = [];
    const authors = [userA, userB];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const timestamp = now - faker.number.int({
            min: 60 * 1000,
            max: 7 * 24 * 60 * 60 * 1000
        });

        messages.push({
            messageId: snowflake.generateId(),
            channelId: channelId,
            createdAt: timestamp,
            author: authors[i % 2],
            body: faker.lorem.sentence({ min: 2, max: 15 }),
            attachments: [],
            active: true,
        });
    }

    messages.sort((a, b) => a.createdAt - b.createdAt);
    return messages;
}

async function seedUsers(database) {
    const users = generateUsers();
    const profiles = users.map(u => ({
        userId: u.id,
        username: u.username,
        profilePictureUrl: `https://i.pravatar.cc/320?u=${u.username}`,
        bio: faker.person.bio(),
        createdAt: u.createdAt,
    }));

    await database.collection("users").insertMany(users);
    await database.collection("profiles").insertMany(profiles);

    console.log(`[seed] Inserted ${users.length} users + profiles.`);
    return users;
}

async function seedFriendships(database, users) {
    const friendships = generateFriendships(users);
    const friendsDocs = [];
    const channels = [];

    for (const f of friendships) {
        const channelId = snowflake.generateId();

        friendsDocs.push({
            users: f.users,
            friendsSince: f.friendsSince,
            directChannelId: channelId,
        });

        channels.push({ channelId, users: f.users });
    }

    if (friendsDocs.length === 0) {
        return channels;
    }

    await database.collection("friends").insertMany(friendsDocs);

    const channelDocs = channels.map(ch => ({
        channelId: ch.channelId,
        channelType: "direct-message",
        createdAt: Date.now(),
        directMessageChannel: {
            members: ch.users,
            createdAt: Date.now(),
        },
    }));

    await database.collection("channels").insertMany(channelDocs);

    console.log(`[seed] Inserted ${friendsDocs.length} friendships + DM channels.`);
    return channels;
}

async function seedMessages(database, users, channels) {
    const allMessages = [];

    for (const ch of channels) {
        const count = faker.number.int({ min: MESSAGES_MIN, max: MESSAGES_MAX });
        const messages = generateMessages(ch.channelId, ch.users[0], ch.users[1], count);
        allMessages.push(...messages);
    }

    if (allMessages.length === 0) {
        return;
    }

    await database.collection("messages").insertMany(allMessages);

    // Update each channel with its last message
    const channelLastMessage = new Map();
    for (const msg of allMessages) {
        const current = channelLastMessage.get(msg.channelId);
        if (!current || msg.createdAt > current.createdAt) {
            channelLastMessage.set(msg.channelId, msg);
        }
    }

    for (const [channelId, lastMsg] of channelLastMessage) {
        await database.collection("channels").updateOne(
            { channelId: channelId },
            {
                $set: {
                    lastMessage: {
                        messageId: lastMsg.messageId,
                        author: lastMsg.author,
                        body: lastMsg.body,
                        createdAt: lastMsg.createdAt,
                    },
                    lastMessageCreatedAt: lastMsg.createdAt,
                }
            }
        );
    }

    console.log(`[seed] Inserted ${allMessages.length} messages across ${channels.length} channels.`);
}

module.exports = { seedIfEmpty };
