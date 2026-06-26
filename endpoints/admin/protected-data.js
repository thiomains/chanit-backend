const users = require("../../users");
const friends = require("../../friends");
const sessions = require("../../sessions");
const globalPermissions = require("../../globalPermissions");
const adminProtocols = require("../../adminProtocols");

const FIELD_MAP = {
    email:     { permission: "viewEmail",     action: "viewEmail" },
    sessions:  { permission: "viewSessions",  action: "viewSessions" },
    ipAddress: { permission: "viewIpAddress", action: "viewIpAddress" },
    friends:   { permission: "viewFriends",   action: "viewFriends" },
};

async function post(req, res) {
    const { field, reason } = req.body;
    const userId = req.params.userId;

    if (!FIELD_MAP[field]) {
        res.status(400).send({ error: "Invalid field" });
        return;
    }
    if (typeof reason !== "string" || reason.length < 10) {
        res.status(400).send({ error: "Reason must be at least 10 characters" });
        return;
    }

    const target = await users.getUserForAdmin(userId);
    if (!target) {
        res.status(404).send({ error: "User not found" });
        return;
    }

    const mapping = FIELD_MAP[field];
    const perms = await globalPermissions.getPermissions(req.auth.user.id);
    if (!perms || perms[mapping.permission] !== true) {
        res.status(403).send({ error: "Forbidden: missing permission '" + mapping.permission + "'" });
        return;
    }

    await adminProtocols.logAction(req.auth.user, userId, target.username, mapping.action, reason, req.ip);

    if (field === "email") {
        res.send({ email: target.email });
        return;
    }

    if (field === "sessions") {
        const userSessions = await sessions.getSessions(userId);
        const stripped = userSessions.map(function (s) {
            var copy = {};
            var keys = Object.keys(s);
            for (var i = 0; i < keys.length; i++) {
                if (keys[i] !== "ipAddress") {
                    copy[keys[i]] = s[keys[i]];
                }
            }
            return copy;
        });
        res.send({ sessions: stripped });
        return;
    }

    if (field === "ipAddress") {
        const userSessions = await sessions.getSessions(userId);
        const ipOnly = userSessions.map(function (s) {
            return {
                sessionId: s.sessionId,
                deviceIdentifier: s.deviceIdentifier,
                ipAddress: s.ipAddress,
            };
        });
        res.send({ sessions: ipOnly });
        return;
    }

    if (field === "friends") {
        const userFriends = await friends.getFriends(userId);
        res.send({ friends: userFriends });
        return;
    }
}

module.exports = { post };
