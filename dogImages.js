const axios = require("axios");

async function randomDogImage() {
    const dogApi = "https://dog.ceo/api/breeds/image/random"
    const res = await axios.get(dogApi)
    const original = res.data.message;
    return original.replace("https://images.dog.ceo/breeds/", "https://cdn.faser.app/dog-api/");
}

module.exports = { randomDogImage }