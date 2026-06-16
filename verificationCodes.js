const db = require('./database')
const snowflake = require('./snowflake')
const mailSender = require("./mailSender")
const users = require("./users")

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

async function getUserCodes(userId) {
    const user = await users.getUser(userId)
    const email = user.email
    const database = await db.connectDatabase();
    const codesCollection = database.collection("verificationCodes");
    return await codesCollection.find({
        emailAddress: email
    }).toArray()
}

async function sendEmailChangeCode(emailAddress, newEmail) {
    const database = await db.connectDatabase();
    const codesCollection = database.collection("verificationCodes");
    const code = generateVerificationCode();
    const verificationCode = {
        emailAddress: emailAddress,
        expiresAt: Date.now() + 1000 * 60 * 5,
        code: code,
        used: false,
        newEmail: newEmail || null
    };
    await codesCollection.insertOne(verificationCode);
    await mailSender.sendEmail(emailAddress, code + " is your Chanit verification code", code + " is your Chanit verification code");
    return code;
}

async function getCodeDocument(emailAddress, code) {
    const database = await db.connectDatabase();
    const codesCollection = database.collection("verificationCodes");
    const doc = await codesCollection.findOne({ emailAddress, code });
    if (!doc) return null;
    if (doc.used) return null;
    if (doc.expiresAt < Date.now()) return null;
    return doc;
}

async function consumeCode(emailAddress, code) {
    const database = await db.connectDatabase();
    const codesCollection = database.collection("verificationCodes");
    await codesCollection.deleteOne({ emailAddress, code });
}

async function deleteUserCodes(email) {
    const database = await db.connectDatabase();
    const codesCollection = database.collection("verificationCodes");
    await codesCollection.deleteMany({ emailAddress: email });
}

module.exports = { sendVerificationCode, isValid, getUserCodes, sendEmailChangeCode, getCodeDocument, consumeCode, deleteUserCodes }