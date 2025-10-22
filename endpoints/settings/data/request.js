const fs = require("fs")
const os = require("os")
const path = require("path")
const archiver = require("archiver")

const mailSender = require("../../../mailSender")

const users = require("../../../users")
const profiles = require("../../../profiles")
const sessions = require("../../../sessions")
const channels = require("../../../channels")
const friends = require("../../../friends")
const messages = require("../../../messages")
const notifications = require("../../../notifications")
const verificationCodes = require("../../../verificationCodes")

async function post(req, res) {
    try {
        const userId = req.auth.user.id

        // 1. Temporäre Datei im OS-Tempordner erstellen
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "userdata-"))
        const zipPath = path.join(tempDir, `user-${userId}-data.zip`)
        const output = fs.createWriteStream(zipPath)

        const archive = archiver("zip", { zlib: { level: 9 } })

        const finalizePromise = new Promise((resolve, reject) => {
            output.on("close", resolve)
            archive.on("error", reject)
        })

        archive.pipe(output)

        // 2. Daten asynchron laden
        const user = await users.getUser(userId)
        const profile = await profiles.getProfile(userId)
        const userSessions = await sessions.getSessions(userId)
        const userChannels = await channels.getRecentDirectChannels(userId)
        const friendRequests = {
            in: await friends.getIncomingFriendRequests(userId),
            out: await friends.getOutgoingFriendRequests(userId)
        }
        const userFriends = await friends.getFriends(userId)
        const userMessages = await messages.getUserMessages(userId)
        const userNotifications = await notifications.getNotifications(userId)
        const userVerificationCodes = await verificationCodes.getUserCodes(userId)

        // 3. Alle JSON-Dateien in das ZIP schreiben
        archive.append(JSON.stringify(user, null, 2), { name: "user.json" })
        archive.append(JSON.stringify(profile, null, 2), { name: "profile.json" })
        archive.append(JSON.stringify(userSessions, null, 2), { name: "sessions.json" })
        archive.append(JSON.stringify(userChannels, null, 2), { name: "channels.json" })
        archive.append(JSON.stringify(userFriends, null, 2), { name: "friends.json" })
        archive.append(JSON.stringify(friendRequests, null, 2), { name: "friend-requests.json" })
        archive.append(JSON.stringify(userMessages, null, 2), { name: "messages.json" })
        archive.append(JSON.stringify(userNotifications, null, 2), { name: "notifications.json" })
        archive.append(JSON.stringify(userVerificationCodes, null, 2), { name: "codes.json" })

        await archive.finalize()
        await finalizePromise

        // 4. Datei an Client senden
        res.download(zipPath, "user-data.zip", (err) => {
            // Datei nach Senden löschen
            fs.unlink(zipPath, () => {})
            if (err) {
                console.error("Download error:", err)
                if (!res.headersSent) res.status(500).send({
                    error: "An error occured while downloading"
                })
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error:"Failed to create archive"
        })
    }
}

module.exports = { post }