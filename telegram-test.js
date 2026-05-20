const axios = require("axios");

const TOKEN = "8745019889:AAHwRY4gRSBihffp2k5NjkBpmS5O38CpoiA";

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