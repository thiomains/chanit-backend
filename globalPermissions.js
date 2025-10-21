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

module.exports = { setPermission, getPermissions };