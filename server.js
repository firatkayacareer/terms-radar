const fs = require("fs");
require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const TELEGRAM_TOKEN =
    process.env.TELEGRAM_TOKEN;

const TELEGRAM_CHAT_ID =
    process.env.TELEGRAM_CHAT_ID;
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const db = new sqlite3.Database("monitoring.db");
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS monitored_sites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE,
            text TEXT,
            checkedAt TEXT
        )
    `);

        db.run(`
        CREATE TABLE IF NOT EXISTS change_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT,
            oldText TEXT,
            newText TEXT,
            changedAt TEXT
        )
    `);

});
let isChecking = false;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

async function checkWebsite(url, keywords = []) {

    const response = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
        }
    });

    const $ = cheerio.load(response.data);

    const text = $("p, h1, h2, h3, li")
        .text()
        .replace(/\s+/g, " ")
        .trim();

    let keywordMatches = [];
    let keywordContexts = [];

    if (typeof keywords !== "undefined" && keywords.length > 0) {

        keywords.forEach(keyword => {

            if (
                text
                    .toLowerCase()
                    .includes(keyword.trim().toLowerCase())
            ) {

                keywordMatches.push(keyword.trim());

                const keywordIndex = text
                    .toLowerCase()
                    .indexOf(keyword.trim().toLowerCase());

                const context = text.substring(
                    Math.max(0, keywordIndex - 60),
                    keywordIndex + 120
                );

                keywordContexts.push({
                    keyword: keyword.trim(),
                    context
                });
            }
        });
    }

    return {
        text,
        keywordMatches,
        keywordContexts
    };
}
app.post("/check", async (req, res) => {

    try {

        const { url, keywords } = req.body;

        if (!url) {

            return res.status(400).json({
                error: "URL gerekli"
            });
        }

        const result = await checkWebsite(url, keywords);

const text = result.text;

const keywordMatches = result.keywordMatches;

const keywordContexts = result.keywordContexts;


        let savedData = {};

        if (fs.existsSync("data.json")) {
            savedData = JSON.parse(fs.readFileSync("data.json"));
        }

      const oldText = savedData[url]?.text;

let changed = false;

let difference = "";

if (oldText && oldText !== text) {

    changed = true;

await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
        chat_id: TELEGRAM_CHAT_ID,

        text:
`🚨 Terms Radar Alert

Site:
${url}

Değişiklik tespit edildi.`
    },
    {
        timeout: 5000
    }
);

    const oldPreview = oldText.substring(0, 300);

    const newPreview = text.substring(0, 300);

  difference = `
ESKİ:

${oldPreview}

YENİ:

${newPreview}
`;

        }

        savedData[url] = {
    text,
    checkedAt: new Date().toLocaleString("tr-TR")
};

db.run(
    `
    INSERT OR REPLACE INTO monitored_sites
    (url, text, checkedAt)
    VALUES (?, ?, ?)
    `,
    [
        url,
        text,
        new Date().toLocaleString("tr-TR")
    ]
);
        fs.writeFileSync("data.json", JSON.stringify(savedData, null, 2));

res.json({
    success: true,
    changed,
    difference,
    keywordMatches,
    keywordContexts
});
    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: "Site okunamadı"
        });
    }
});

app.get("/sites", (req, res) => {

    db.all(
    "SELECT * FROM monitored_sites",
    [],
    (err, rows) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        const result = rows.map(site => {

            return {
                url: site.url,
                checkedAt: site.checkedAt,
                changed: false
            };
        });

        res.json(result);
    }
);
});

app.delete("/delete-site", (req, res) => {
const { url } = req.body;

db.run(
    `
    DELETE FROM monitored_sites
    WHERE url = ?
    `,
    [url],
    function (err) {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            success: true
        });
    }
);
});
setInterval(async () => {

    if (isChecking) {

        console.log(
            "⏳ Önceki kontrol hâlâ çalışıyor"
        );

        return;
    }

    isChecking = true;

    console.log(
        "⏰ Otomatik kontrol çalıştı"
    );

    db.all(
        "SELECT * FROM monitored_sites",
        [],
        async (err, rows) => {

            if (err) {

                console.log(err.message);

                isChecking = false;

                return;
            }

            for (const site of rows) {

                const url = site.url;

                try {

                    console.log(
                        "Kontrol ediliyor:",
                        url
                    );

                    const result =
                        await checkWebsite(url);

                    const newText = result.text;

                    const oldText = site.text;
const differenceSize = Math.abs(
    newText.length - oldText.length
);

if (
    oldText &&
    oldText !== newText &&
    differenceSize > 20
)
                   {

                        console.log(
                            "🚨 Değişiklik bulundu:",
                            url
                        );

                        const oldPreview =
                            oldText.substring(0, 200);

                        const newPreview =
                            newText.substring(0, 200);

                        const difference = `
ESKİ:

${oldPreview}

YENİ:

${newPreview}
`;
await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
        chat_id:
            TELEGRAM_CHAT_ID,

        text:
`🚨 Terms Radar Alert

Site:
${url}

📌 Değişiklik Özeti:

${difference}

⏰ ${new Date().toLocaleString("tr-TR")}
`
    },
    {
        timeout: 5000
    }
);
db.run(
    `
    INSERT INTO change_history
    (url, oldText, newText, changedAt)
    VALUES (?, ?, ?, ?)
    `,
    [
        url,
        oldText,
        newText,
        new Date().toLocaleString("tr-TR")
    ]
);
                        db.run(
                            `
                            UPDATE monitored_sites
                            SET text = ?, checkedAt = ?
                            WHERE url = ?
                            `,
                            [
                                newText,
                                new Date().toLocaleString("tr-TR"),
                                url
                            ]
                        );
                    }

                } catch (error) {

                    console.log(
                        "Scheduler Hatası:"
                    );

                    console.log(error.message);
                }
            }

            isChecking = false;
        }
    );

}, 60000);
app.listen(3000, () => {
    console.log("Server çalışıyor: http://localhost:3000");
    
});

console.log("YENI SERVER CALISTI");
