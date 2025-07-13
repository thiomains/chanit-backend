const sessions = require("./sessions");

async function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;
    const sessionId = req.headers.session;

    if (!authHeader || !sessionId) {
        console.log(authHeader, sessionId)
        res.status(401).send("Invalid or expired session");
        return;
    }

    if (!authHeader.startsWith("Bearer ")) {
        res.status(401).send("Invalid or expired session");
        return;
    }

    const token = authHeader.split(" ")[1];

    const user = await sessions.validateAccess(sessionId, token);

    if (user.length === 0) {
        res.status(401).send("Invalid or expired session");
        return;
    }

    const session = await sessions.getSession(sessionId);

    req.auth = {
        user: user[0],
        session: session
    }

    next();
}

module.exports = authMiddleware;