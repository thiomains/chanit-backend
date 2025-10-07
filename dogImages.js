const axios = require("axios");

async function randomDogImage() {
    const dogApi = "https://dog.ceo/api/breeds/image/random"
    const res = await axios.get(dogApi)
    return res.data.message;
}

module.exports = { randomDogImage }