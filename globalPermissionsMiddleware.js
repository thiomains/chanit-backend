const globalPermissions = require("./globalPermissions")

function globalPermissionsMiddleware(requiredPermissions) {

    return async function(req, res, next) {
        const userId = req.auth.user.id;

        const userPerms = await globalPermissions.getPermissions(userId)
        if (!userPerms) {
            res.status(403).send({
                error: "Forbidden"
            })
        }
        const userPermsArray = Object.keys(userPerms);
        const hasAllPermissions = requiredPermissions.every(perm => userPermsArray.includes(perm));
        if (!hasAllPermissions) {
            return res.status(403).send({ error: "Forbidden" });
        }

        next();
    }
}

module.exports = globalPermissionsMiddleware;