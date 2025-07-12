const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('helo');
})

app.post('/api/auth/register', require('./endpoints/auth/register'))
app.post('/api/auth/login', require('./endpoints/auth/login'))
app.post('/api/auth/session/refresh', require('./endpoints/auth/session/refresh'))

app.listen(process.env.PORT, () => {
    console.log("App listening on port " + process.env.PORT);
});