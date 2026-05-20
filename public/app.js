async function checkSite() {

    const url = document.getElementById("urlInput").value;
    const keywords =
    document.getElementById("keywordInput")
    .value
    .split(",");
    const result = document.getElementById("result");

    result.innerHTML = "Kontrol ediliyor...";

    try {

        const response = await fetch("/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
    url,
    keywords
})
        });

        const data = await response.json();

        console.log("GELEN DATA:", data);

        
        const degisim = data.changed;
        const difference = data.difference;
        const keywordMatches = data.keywordMatches;
        const keywordContexts = data.keywordContexts || [];
        

        result.innerHTML = `
            <h3>Başarılı ✅</h3>

            <p>
                <strong>Değişiklik Durumu:</strong>
                ${degisim ? "🚨 Değişiklik Var" : "✅ Değişiklik Yok"}
            </p>

   <p>
    <strong>🕒 Son Kontrol:</strong>
    ${new Date().toLocaleString("tr-TR")}
</p>

<p>
    <strong>🔎 Bulunan Kelimeler:</strong>
    ${
        keywordMatches.length > 0
            ? keywordMatches.join(", ")
            : "Bulunamadı"
    }
</p>
${keywordContexts.length > 0 ? `
    <div style="
        margin-top:15px;
        background:#111827;
        padding:12px;
        border-radius:10px;
    ">

        <strong>🧠 Kelime Bağlamı</strong>

        ${keywordContexts.map(item => `
            <div style="
                margin-top:10px;
                background:#1e293b;
                padding:10px;
                border-radius:8px;
            ">
                <strong style="color:#60a5fa;">
                    ${item.keyword}
                </strong>

                <p style="
                    margin-top:5px;
                    color:#e2e8f0;
                ">
                    ...${item.context}...
                </p>
            </div>
        `).join("")}

    </div>
` : ""}
    ${
        keywordMatches.length > 0
            ? keywordMatches.join(", ")
            : "Bulunamadı"
    }
</p>
    ${new Date().toLocaleString("tr-TR")}


`;

if (degisim) {

    result.innerHTML += `
        <div style="
            margin-top:15px;
            background:#0f172a;
            border-radius:12px;
            padding:15px;
        ">

            <h4 style="
                margin-top:0;
                color:#f8fafc;
            ">
                🚨 Değişiklik Detayı
            </h4>

            <div style="
                background:#3f1d1d;
                color:#fecaca;
                padding:10px;
                border-radius:8px;
                margin-top:10px;
                white-space:pre-wrap;
            ">
                🔴 Önceki İçerik

${difference.split("YENİ:")[0]}
            </div>

            <div style="
                background:#052e16;
                color:#bbf7d0;
                padding:10px;
                border-radius:8px;
                margin-top:10px;
                white-space:pre-wrap;
            ">
                🟢 Yeni İçerik

${difference.split("YENİ:")[1]}
            </div>

        </div>
    `;
}
    } catch (error) {

        console.error(error);

       result.innerHTML = `
    <p style="color:#f87171;">
        ⚠️ Site erişimi engelledi veya hata verdi.
    </p>
`;
        loadSites();
    }
}

async function loadSites() {

    const savedSites = document.getElementById("savedSites");

    const response = await fetch("/sites");

    const data = await response.json();

    savedSites.innerHTML = "";

    data.forEach(site => {

      savedSites.innerHTML += `
    <div style="
        background:#334155;
        padding:10px;
        border-radius:8px;
        margin-top:10px;

        display:flex;
        justify-content:space-between;
        align-items:center;
    ">

        <div>
            <strong class="site-url">
    ${site.url}
</strong>
            <br>
            ${site.changed ? "🚨 Değişiklik Var" : "✅ Değişiklik Yok"}
            <br>
🕒 ${site.checkedAt}
        </div>

        <button
            onclick="deleteSite('${site.url}')"
            style="
                width:auto;
                min-height:auto;
                padding:8px 12px;
                background:#ef4444;
            "
        >
            🗑️
        </button>

    </div>
`;
    });
}
loadSites();
async function deleteSite(url){

    await fetch("/delete-site", {
        method:"DELETE",
        headers:{
            "Content-Type":"application/json"
        },
       
        body: JSON.stringify({ url })
    });

    loadSites();
}