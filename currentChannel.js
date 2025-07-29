let channels = new Map()

function setCurrentChannel(ws, channelId) {
    const oldChannelId = ws.currentChannelId
    if (!channels.get(channelId)) {
        channels.set(channelId, new Set())
    }
    channels.get(channelId).add(ws)

    if (!oldChannelId) return
    channels.get(oldChannelId).delete(ws)
    ws.currentChannelId = channelId
}

function getChannelConnections(channelId) {
    return channels.get(channelId)
}

function sendToChannel(channelId, message) {
    const msgString = JSON.stringify(message)
    const connections = getChannelConnections(channelId)
    if (!connections) return
    for (connection of connections) {
        connection.send(msgString)
    }
}

module.exports = { setCurrentChannel, getChannelConnections, sendToChannel }