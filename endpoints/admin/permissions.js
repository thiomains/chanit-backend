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

module.exports = { list, get, set };
