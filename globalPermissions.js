const db = require('./database')
const snowflake = require("./snowflake");

async function setPermission(userId, permission, value) {
    const database = await db.connectDatabase();
    const permsCollection = database.collection("globalPermissions");

    await permsCollection.updateOne(
        { userId: userId },
        { $set: { [permission]: value } },
        { upsert: true }
    );
}

async function getPermissions(userId) {
    const database = await db.connectDatabase();
    const permsCollection = database.collection("globalPermissions");
    return await permsCollection.findOne({
        userId: userId
    })
}

async function setPermissions(userId, permissions) {
    const database = await db.connectDatabase();
    const permsCollection = database.collection("globalPermissions");

    await permsCollection.updateOne(
        { userId: userId },
        { $set: permissions },
        { upsert: true }
    );
}

async function deletePermissions(userId) {
    const database = await db.connectDatabase();
    const permsCollection = database.collection("globalPermissions");
    await permsCollection.deleteOne({ userId: userId });
}

module.exports = { setPermission, setPermissions, getPermissions, deletePermissions };