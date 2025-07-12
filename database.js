const {MongoClient} = require('mongodb');
require('dotenv').config();

const url = process.env.MONGODB_URL;
const client = new MongoClient(url);

let database;

async function connectDatabase() {
    try {
        if (!database) {
            await client.connect();
            database = client.db(process.env.MONGODB_DB);
        }
        return database;
    } catch (e) {
        console.log("Error connecting to mongodb" + e);
    }
}

module.exports = {connectDatabase};