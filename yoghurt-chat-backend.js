const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const authMiddleware = require("./authMiddleware");
const globalPermissionsMiddleware = require("./globalPermissionsMiddleware");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors({
    origin: [ "https://chanit.app", "http://localhost:3000" ],
    credentials: true,
}))
app.use(cookieParser());
app.use(express.json());
const expressWs = require("express-ws")(app)

app.set('trust proxy', 1)

app.use('/api/auth/me', authMiddleware)
app.use('/api/auth/verification-code/', authMiddleware)
app.use('/api/user/', authMiddleware)
app.use('/api/channel/', authMiddleware)
app.use('/api/message/', authMiddleware)
app.use('/api/settings/', authMiddleware)
app.use('/api/notifications/', authMiddleware)
app.use('/api/admin/', authMiddleware)

app.get('/', (req, res) => {
    res.send('helo');
})

app.ws("/events", require('./events').ws)

app.post('/api/auth/register', require('./endpoints/auth/register'))
app.post('/api/auth/faser', require('./endpoints/auth/faser').post)
app.post('/api/auth/login', require('./endpoints/auth/login'))
app.post('/api/auth/logout', require('./endpoints/auth/logout'))
app.post('/api/auth/session/refresh', require('./endpoints/auth/session/refresh'))
app.get('/api/auth/me', require('./endpoints/auth/me'))
app.post('/api/auth/verification-code/verify', require('./endpoints/auth/verification-code').verify)
app.post('/api/auth/verification-code/', rateLimit({windowMs: 1000*60*2, max: 1, message: {error:"You need to wait 120 seconds between requesting verification codes"} }), require('./endpoints/auth/verification-code').send)

app.get('/api/user/:id', require('./endpoints/user/publicUser'))
app.get('/api/user/:id/profile', require('./endpoints/user/profile').get)
app.get('/api/user/:id/friends', require('./endpoints/user/friends').get)
app.post('/api/user/:id/friends', require('./endpoints/user/friends').post)
app.delete('/api/user/:id/friends', require('./endpoints/user/friends').remove)
app.get('/api/user/:id/friends/requests', require('./endpoints/user/friends/requests').get)
app.get('/api/user/me/recent', require('./endpoints/user/recent').get)

app.get('/api/channel/:id', require('./endpoints/channel/channel').get)
app.get('/api/channel/:id/messages', require('./endpoints/channel/messages').get)
app.post('/api/channel/:id/messages', require('./endpoints/channel/messages').post)

app.post('/api/message/:id/attachments', require('./fileUpload').upload.single('attachment'), require('./endpoints/message/attachments').post)
app.delete('/api/message/:id/', require('./endpoints/message/delete').del)
app.patch('/api/message/:id/', require('./endpoints/message/patch').patch)

app.post('/api/settings/profile/', require('./endpoints/settings/profile/profileUpdate').post)
app.post('/api/settings/profile/avatar', require('./fileUpload').upload.single('avatar'), require('./endpoints/settings/profile/avatar').post)
app.delete('/api/settings/profile/avatar', require('./fileUpload').upload.single('avatar'), require('./endpoints/settings/profile/avatar').remove)

app.post('/api/settings/data/', require('./endpoints/settings/data/request').post)

app.get('/api/notifications', require('./endpoints/notifications/notifications').get)
app.delete('/api/notifications/:id', require('./endpoints/notifications/notifications').del)

app.get('/api/admin/users', globalPermissionsMiddleware(["adminAccess", "viewUserInformation"]), require('./endpoints/admin/users').get)
app.get('/api/admin/me', globalPermissionsMiddleware(["adminAccess"]), require('./endpoints/admin/me').get)

app.listen(process.env.PORT, () => {
    console.log("App listening on port " + process.env.PORT);
});