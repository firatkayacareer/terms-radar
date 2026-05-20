const axios = require("axios");

const TOKEN = "AAETlnMGp23VtDBVUkPbhjrlL7lAa3as6v0";

const CHAT_ID = "5014444499";

axios
    .post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: "🚨 Terms Radar test bildirimi başarılı!"
    })
    .then(res => {
        console.log("Mesaj gönderildi!");
    })
    .catch(err => {
        console.log(err.response.data);
    });