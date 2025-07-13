const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const authMiddleware = require("./authMiddleware");

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth/me', authMiddleware)

app.get('/', (req, res) => {
    res.send('helo');
})

app.post('/api/auth/register', require('./endpoints/auth/register'))
app.post('/api/auth/login', require('./endpoints/auth/login'))
app.post('/api/auth/logout', require('./endpoints/auth/logout'))
app.post('/api/auth/session/refresh', require('./endpoints/auth/session/refresh'))
app.get('/api/auth/me', require('./endpoints/auth/me'))

app.listen(process.env.PORT, () => {
    console.log("App listening on port " + process.env.PORT);
});