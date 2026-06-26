const db = require('./database');
const snowflake = require('./snowflake');

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
    return doc;
}

async function getProtocols({ admin, action, target, page = 1, limit = 50 } = {}) {
    const filter = {};
    if (admin) filter.adminUserId = admin;
    if (action) filter.action = action;
    if (target) filter.targetUserId = target;

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
    return getProtocols({ target: userId });
}

module.exports = { logAction, getProtocols, getProtocolsByUser };
