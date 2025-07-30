const currentChannel = require("./currentChannel")
const sessions = require("./sessions");

let socketConnections = new Map()

async function ws(ws, req) {

    const accessToken = req.query.token;
    const sessionId = req.query.session;

    if (!accessToken || !sessionId) {
        ws.send(JSON.stringify({
            type: "authentication-failure",
            message: "Invalid or expired session"
        }))
        ws.close()
        return;
    }

    const user = await sessions.validateAccess(sessionId, accessToken);

    if (user.length === 0) {
        ws.send(JSON.stringify({
            type: "authentication-failure",
            message: "Invalid or expired session"
        }))
        ws.close()
        return;
    }

    const session = await sessions.getSession(sessionId);

    req.auth = {
        user: user[0],
        session: session
    }

    ws.send(JSON.stringify({
        type: "authentication-success",
        message: "Successfully authenticated"
    }))

    const userId = req.auth.user.id

    if (!socketConnections.has(userId)) {
        socketConnections.set(userId, new Set())
    }
    socketConnections.get(userId).add(ws)
    ws.userId = userId

    ws.on("close", () => {
        const set = socketConnections.get(ws.userId)
        set.delete(ws)
        if (set.size === 0) {
            socketConnections.delete(ws.userId)
        }
    })

    ws.on("message", (msg) => {
        const data = JSON.parse(msg)
        if (data.type === "view-channel") {
            currentChannel.setCurrentChannel(ws, data.channelId)
        } else if (data.type === "typing") {
            currentChannel.sendToChannel(data.channelId, {
                type: "typing",
                channelId: data.channelId,
                userId: ws.userId
            })
        }
    })
}

async function sendMessage(userId, message) {
    const msgString = JSON.stringify(message)
    const connectionSet = socketConnections.get(userId)
    if (!connectionSet) return
    for (ws of connectionSet) {
        ws.send(msgString)
    }
}

module.exports = { ws, sendMessage }