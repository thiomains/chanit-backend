const sessions = require('../../../sessions');
const cookieParser = require('cookie-parser');
const {refreshToken} = require("../../../sessions");

async function refresh(req, res) {

    if (!req.cookies.session) {
        res.status(401).send("Invalid or expired session");
        return;
    }

    console.log(req.cookies.session)
    const session = await sessions.refreshToken(req.cookies.session.sessionId, req.cookies.session.refreshToken);
    if (!session) {
        res.status(401).send("Invalid or expired session");
        return;
    }

    const newSession = await sessions.refreshToken(session.sessionId, session.refreshToken);

    const cookieContent = {
        sessionId: newSession.sessionId,
        refreshToken: newSession.refreshToken
    }

    sessions.setSessionCookieAndSend(res, session, 200, {
        expiresAt: newSession.accessTokenExpiresAt,
        accessToken: newSession.accessToken,
    });

}

module.exports = refresh;