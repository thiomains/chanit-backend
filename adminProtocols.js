const db = require('./database');
const snowflake = require('./snowflake');
const axios = require('axios');

const WEBHOOK_URL = process.env.DISCORD_PROTOCOL_WEBHOOK_URL;

async function sendDiscordNotification(doc) {
    if (!WEBHOOK_URL) return;

    const embed = {
        title: 'New Admin Protocol Entry',
        color: 0x5865f2, // Discord blurple
        fields: [
            { name: 'ID', value: doc.id, inline: false },
            { name: 'Admin', value: doc.adminUsername, inline: true },
            { name: 'Target User', value: doc.targetUsername, inline: true },
            { name: 'Target ID', value: doc.targetUserId, inline: true },
            { name: 'Action', value: doc.action, inline: true },
            { name: 'IP Address', value: doc.ipAddress, inline: true },
            { name: 'Reason', value: doc.reason, inline: false },
        ],
        timestamp: new Date(doc.timestamp).toISOString(),
        footer: { text: 'Chanit Admin Protocol' },
    };

    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
    } catch (err) {
        console.error('[adminProtocols] Failed to send Discord webhook:', err.message);
    }
}

async function logAction(adminUser, targetUserId, targetUsername, action, reason, ip) {
    const database = await db.connectDatabase();
    const col = database.collection('adminProtocols');
    const doc = {
        id: snowflake.generateId(),
        adminUserId: adminUser.id,
        adminUsername: adminUser.username,
        targetUserId,
        targetUsername,
        action,
        reason,
        timestamp: Date.now(),
        ipAddress: ip,
    };
    await col.insertOne(doc);

    sendDiscordNotification(doc);

    return doc;
}

async function getProtocols({ admin, action, target, targetId, page = 1, limit = 50 } = {}) {
    const filter = {};
    if (admin) filter.adminUsername = { $regex: admin, $options: 'i' };
    if (action) filter.action = action;
    if (target) filter.targetUsername = { $regex: target, $options: 'i' };
    if (targetId) filter.targetUserId = targetId;

    console.log('[getProtocols] filter:', JSON.stringify(filter));

    const database = await db.connectDatabase();
    const col = database.collection('adminProtocols');

    const total = await col.countDocuments(filter);
    const items = await col
        .find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

    return { items, total, page, limit };
}

async function getProtocolsByUser(userId) {
    return getProtocols({ targetId: userId });
}

module.exports = { logAction, getProtocols, getProtocolsByUser };
