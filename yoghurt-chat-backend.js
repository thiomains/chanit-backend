const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const authMiddleware = require("./authMiddleware");

const app = express();
app.use(cors({
    origin: [ "https://yoghurt.minescope.eu", "http://localhost:3000" ],
    credentials: true,
}))
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth/me', authMiddleware)
app.use('/api/user/', authMiddleware)
app.use('/api/channel/', authMiddleware)

app.get('/', (req, res) => {
    res.send('helo');
})

app.post('/api/auth/register', require('./endpoints/auth/register'))
app.post('/api/auth/faser', require('./endpoints/auth/faser').post)
app.post('/api/auth/login', require('./endpoints/auth/login'))
app.post('/api/auth/logout', require('./endpoints/auth/logout'))
app.post('/api/auth/session/refresh', require('./endpoints/auth/session/refresh'))
app.get('/api/auth/me', require('./endpoints/auth/me'))

app.get('/api/user/:id', require('./endpoints/user/publicUser'))
app.get('/api/user/:id/friends', require('./endpoints/user/friends').get)
app.post('/api/user/:id/friends', require('./endpoints/user/friends').post)

app.get('/api/channel/:id', require('./endpoints/channel/channel').get)
app.get('/api/channel/:id/messages', require('./endpoints/channel/messages').get)
app.post('/api/channel/:id/messages', require('./endpoints/channel/messages').post)

app.listen(process.env.PORT, () => {
    console.log("App listening on port " + process.env.PORT);
});