const db = require('./database')
const snowflake = require('./snowflake')
const mailSender = require("./mailSender")

async function sendVerificationCode(address) {
    const database = await db.connectDatabase();
    const codesCollection = database.collection("verificationCodes");
    const verificationCode = {
        emailAddress: address,
        expiresAt: Date.now() + 1000 * 60 * 5,
        code: generateVerificationCode(),
        used: false
    }
    await codesCollection.insertOne(verificationCode)
    await mailSender.sendEmail(address, verificationCode.code + " is your Chanit verification code", verificationCode.code + " is your Chanit verification code")
}

function generateVerificationCode() {
    let code = ""
    const chars = "1234567890"
    for (let i = 0; i < 6; i++) {
        code = code + chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

async function isValid(address, code) {
    const database = await db.connectDatabase();
    const codesCollection = database.collection("verificationCodes");
    const document = await codesCollection.findOne({
        emailAddress: address,
        code: code,
    })
    if (!document) return false
    if (document.used) return false
    if (document.expiresAt < Date.now()) return false
    await codesCollection.deleteOne({
        emailAddress: address,
        code: code,
    })

    return true
}

module.exports = { sendVerificationCode, isValid }