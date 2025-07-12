const sessions = require('../../../sessions');

async function refresh(req, res) {
    const session = req.cookies.session;
    const refreshToken = session.refreshToken;

    const newSession = await sessions.refreshToken();
}