const users = require('../../users')
const axios = require('axios')
const sessions = require("../../sessions");

async function post(req, res) {
    const code = req.body.code

    const faserRes = await axios.post('https://api.faser.app/developer/authToken', {
        code: code,
        clientId: process.env.FASER_CLIENT_ID,
        clientSecret: process.env.FASER_CLIENT_SECRET
    })

    const faserAuthToken = faserRes.data.authToken

    const userData = await axios.post('https://api.faser.app/developer/getData', {
        accessToken: faserAuthToken,
        clientId: process.env.FASER_CLIENT_ID,
        clientSecret: process.env.FASER_CLIENT_SECRET
    })

    console.log(userData.data)

    if (userData.data.status !== "success") {
        // oh nein
        return;
    }

    const userExists = await users.getUserByFaser(userData.data.data.id);
    if (userExists) {
        const session = await sessions.createSession(userExists.id, req.headers["user-agent"], req.ip);
        sessions.setSessionCookieAndSend(res, session, 200, {
            message: "Logged in successfully"
        });
        return;
    }

    const checkIfEmailIsTaken = await users.getUserByEmail(userData.data.data.email)
    if (checkIfEmailIsTaken) {
        res.status(409).send({
            error: "Email is already taken"
        });
        return;
    }

    let username = userData.data.data.username

    let checkIfUsernameIsTaken = await users.getUserByName(username)
    while (checkIfUsernameIsTaken) {
        username = modifyString(username);
        checkIfUsernameIsTaken = await users.getUserByName(username)
    }

    const user = await users.createAccount(username, userData.data.data.email, "faser authenticated", userData.data.data.id)
    console.log(user)
    const session = await sessions.createSession(user.id, req.headers["user-agent"], req.ip);
    sessions.setSessionCookieAndSend(res, session, 201, {
        message: "Account created successfully"
    });
}

function modifyString(inputString) {
    // Fülle den String mit Unterstrichen auf, falls er kürzer als 10 Zeichen ist
    const paddedString = inputString.padEnd(10, '_');

    // Nimm genau 10 Zeichen
    const firstPart = paddedString.slice(0, 10);

    // Generiere 4 zufällige Zeichen (a-Z und 0-1)
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomPart += characters[randomIndex];
    }

    // Kombiniere die Teile mit einem Unterstrich
    return `${firstPart}_${randomPart}`;
}



module.exports = { post }