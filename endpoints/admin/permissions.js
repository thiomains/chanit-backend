const db = require("../../database");
const globalPermissions = require("../../globalPermissions");
const adminProtocols = require("../../adminProtocols");
const users = require("../../users");

const VALID_PERMISSIONS = [
    "adminAccess",
    "viewUserInformation",
    "viewEmail",
    "viewIpAddress",
    "viewSessions",
    "viewFriends",
    "suspendUser",
    "managePermissions",
    "viewProtocols",
];

async function list(req, res) {
    const database = await db.connectDatabase();
    const permsCol = database.collection("globalPermissions");
    const profilesCol = database.collection("profiles");

    const allPerms = await permsCol.find({}).toArray();

    const result = await Promise.all(allPerms.map(async (permsDoc) => {
        const profile = await profilesCol.findOne({ userId: permsDoc.userId });
        const permissions = {};
        for (const key of VALID_PERMISSIONS) {
            if (key in permsDoc) {
                permissions[key] = permsDoc[key];
            }
        }
        return {
            userId: permsDoc.userId,
            username: profile ? profile.username : null,
            profilePictureUrl: profile ? profile.profilePictureUrl : null,
            permissions,
        };
    }));

    res.send(result);
}

async function get(req, res) {
    const perms = await globalPermissions.getPermissions(req.params.userId);
    if (!perms) {
        res.status(404).send({ error: "No permissions found" });
        return;
    }
    res.send(perms);
}

async function set(req, res) {
    const { permission, value } = req.body;

    if (typeof value !== "boolean") {
        res.status(400).send({ error: "value must be boolean" });
        return;
    }

    if (!VALID_PERMISSIONS.includes(permission)) {
        res.status(400).send({ error: "Unknown permission: " + permission });
        return;
    }

    await globalPermissions.setPermission(req.params.userId, permission, value);

    const target = await users.getUserForAdmin(req.params.userId);

    await adminProtocols.logAction(
        req.auth.user,
        req.params.userId,
        target ? target.username : req.params.userId,
        "setPermission",
        `Set ${permission} to ${value}`,
        req.ip,
    );

    res.send({ success: true });
}

async function add(req, res) {
    const { username } = req.body;

    if (!username || typeof username !== "string") {
        res.status(400).send({ error: "username is required" });
        return;
    }

    const user = await users.getUserForAdminByName(username);
    if (!user) {
        res.status(404).send({ error: "User not found" });
        return;
    }

    await globalPermissions.setPermission(user.id, "adminAccess", true);

    const database = await db.connectDatabase();
    const profilesCol = database.collection("profiles");
    const profile = await profilesCol.findOne({ userId: user.id });

    await adminProtocols.logAction(
        req.auth.user,
        user.id,
        user.username,
        "addAdminAccess",
        `Granted admin access to ${username}`,
        req.ip,
    );

    res.status(201).send({
        userId: user.id,
        username: profile ? profile.username : user.username,
        profilePictureUrl: profile ? profile.profilePictureUrl : null,
        permissions: { adminAccess: true },
    });
}

async function bulkSet(req, res) {
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== "object") {
        res.status(400).send({ error: "permissions object is required" });
        return;
    }

    for (const key of Object.keys(permissions)) {
        if (!VALID_PERMISSIONS.includes(key)) {
            res.status(400).send({ error: "Unknown permission: " + key });
            return;
        }
        if (typeof permissions[key] !== "boolean") {
            res.status(400).send({ error: `value for ${key} must be boolean` });
            return;
        }
    }

    await globalPermissions.setPermissions(req.params.userId, permissions);

    const target = await users.getUserForAdmin(req.params.userId);

    await adminProtocols.logAction(
        req.auth.user,
        req.params.userId,
        target ? target.username : req.params.userId,
        "bulkSetPermissions",
        "Set permissions: " + JSON.stringify(permissions),
        req.ip,
    );

    res.send({ success: true });
}

async function remove(req, res) {
    await globalPermissions.deletePermissions(req.params.userId);

    const target = await users.getUserForAdmin(req.params.userId);

    await adminProtocols.logAction(
        req.auth.user,
        req.params.userId,
        target ? target.username : req.params.userId,
        "removeAdminAccess",
        "Removed admin access",
        req.ip,
    );

    res.send({ success: true });
}

module.exports = { list, get, set, add, bulkSet, remove };
