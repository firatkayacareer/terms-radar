let currentLanguage = "tr";
async function checkSite() {

    const url = document.getElementById("urlInput").value;

    const keywords = document.getElementById("keywordInput").value.split(",");

    const result = document.getElementById("result");

    result.innerHTML = `
        <div class="result-item">
            ⏳ Monitoring başlatılıyor...
        </div>
    `;

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
            <h3>${translations[currentLanguage].statusTitle}</h3>

            <div class="result-item">
                <span class="result-label">Sistem:</span>
                ${degisim ? "🚨 Değişiklik Algılandı" : "✅ Monitoring Active"}
            </div>

            <div class="result-item">
                <span class="result-label">🕒 Son Kontrol:</span>
                ${new Date().toLocaleString("tr-TR")}
            </div>

            <div class="result-item">
                <span class="result-label">🔎 Bulunan Kelimeler:</span>
                ${keywordMatches.length > 0 ? keywordMatches.join(", ") : "Bulunamadı"}
            </div>

            ${keywordContexts.length > 0 ? `
                <div style="margin-top:20px; background:#111827; padding:16px; border-radius:12px;">
                    <strong style="color:white;">🧠 Kelime Bağlamı</strong>
                    ${keywordContexts.map(item => `
                        <div style="margin-top:12px; background:#1e293b; padding:12px; border-radius:10px;">
                            <strong style="color:#60a5fa;">${item.keyword}</strong>
                            <p style="margin-top:8px; color:#e2e8f0; line-height:1.6;">...${item.context}...</p>
                        </div>
                    `).join("")}
                </div>
            ` : ""}
        `;

        if (degisim) {
            result.innerHTML += `
                <div style="margin-top:20px; background:#0f172a; border-radius:14px; padding:18px;">
                    <h4 style="margin-top:0; color:#f8fafc;">🚨 Değişiklik Detayı</h4>
                    <div style="background:#3f1d1d; color:#fecaca; padding:12px; border-radius:10px; margin-top:12px; white-space:pre-wrap;">
                        🔴 Önceki İçerik
                        ${difference.split("YENİ:")[0]}
                    </div>
                    <div style="background:#052e16; color:#bbf7d0; padding:12px; border-radius:10px; margin-top:12px; white-space:pre-wrap;">
                        🟢 Yeni İçerik
                        ${difference.split("YENİ:")[1]}
                    </div>
                </div>
            `;
        }

        loadSites();

    } catch (error) {
        console.error("GERCEK HATA:", error);
        result.innerHTML = `
            <div class="result-item">
                ❌ ${error}
            </div>
        `;
    }
}

async function loadSites() {
    const savedSites = document.getElementById("savedSites");
    const response = await fetch("/sites");
    const data = await response.json();

    savedSites.innerHTML = "";

    data.forEach(site => {
        savedSites.innerHTML += `
            <div class="site-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:15px;">
                    <div>
                        <div class="site-url">${site.url}</div>
                        <div class="site-meta">🕒 Son kontrol: ${site.checkedAt}</div>
                        <div class="site-status">
                            ${site.changed ? "🚨 Change Detected" : "✅ Monitoring Active"}
                        </div>
                    </div>
                    <button onclick="deleteSite('${site.url}')" style="width:auto; min-height:auto; padding:10px 14px; background:#ef4444; border:none; border-radius:10px;">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    });
}

loadSites();

async function deleteSite(url) {
    await fetch("/delete-site", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ url })
    });
    loadSites();
}

// --- TRANSLATIONS NESNESİ (Hataların düzeltildiği kısım) ---
const translations = {
    tr: {
        hero: `Kritik web sitesi değişikliklerini anında yakalayın.`,
        subtitle: `Fiyat değişimleri, kullanım şartları ve kampanya güncellemelerini takip edin.`,
        live: `<span class="live-dot"></span> Monitoring Sistemi Aktif`,
        useCases: `Örnek Kullanım Alanları`,
        case1: `💰 Fiyat değişimlerini takip edin`,
        case2: `📄 İade politikası güncellemelerini görün`,
        case3: `⚖️ Kullanım şartlarındaki değişiklikleri yakalayın`,
        case4: `🏷️ Kampanya ve indirim değişikliklerini izleyin`,
        case5: `📈 Rakip web sitelerini otomatik takip edin`,
        button: `Takibi Başlat`,
        keywordPlaceholder: `Keywords to monitor (ex: refund, privacy)`,
        statusTitle: `Monitoring Status`,
        statusText: `Ready to start monitoring`
    },
    en: {
        hero: `Monitor critical website changes before they surprise you.`,
        subtitle: `Track pricing updates, terms of service changes and campaign updates automatically.`,
        live: `<span class="live-dot"></span> Monitoring Engine Active`,
        useCases: `Example Use Cases`,
        case1: `💰 Track pricing changes`,
        case2: `📄 Monitor refund policy updates`,
        case3: `⚖️ Detect terms of service changes`,
        case4: `🏷️ Follow campaign and discount updates`,
        case5: `📈 Automatically monitor competitor websites`,
        button: `Start Monitoring`, // DÜZELTİLDİ
        keywordPlaceholder: `Keywords to monitor (ex: refund, privacy)`, // DÜZELTİLDİ
        statusTitle: `Monitoring Status`, // DÜZELTİLDİ
        statusText: `Ready to start monitoring`
    }
};

function setLanguage(lang) {
    currentLanguage = lang;

    const heroTitle = document.getElementById("heroTitle");
    const subtitle = document.getElementById("subtitle");
    const liveIndicator = document.getElementById("liveIndicator");
    const useCasesTitle = document.getElementById("useCasesTitle");
    const case1 = document.getElementById("case1");
    const case2 = document.getElementById("case2");
    const case3 = document.getElementById("case3");
    const case4 = document.getElementById("case4");
    const case5 = document.getElementById("case5");
    const checkButton = document.getElementById("checkButton");
    const keywordInput = document.getElementById("keywordInput");
    const statusTitle = document.getElementById("statusTitle");
    const statusText = document.getElementById("statusText");

    if(heroTitle) heroTitle.innerHTML = translations[lang].hero;
    if(subtitle) subtitle.innerHTML = translations[lang].subtitle;
    if(liveIndicator) liveIndicator.innerHTML = translations[lang].live;
    if(useCasesTitle) useCasesTitle.innerHTML = translations[lang].useCases;
    if(case1) case1.innerHTML = translations[lang].case1;
    if(case2) case2.innerHTML = translations[lang].case2;
    if(case3) case3.innerHTML = translations[lang].case3;
    if(case4) case4.innerHTML = translations[lang].case4;
    if(case5) case5.innerHTML = translations[lang].case5;
    if(checkButton) checkButton.innerHTML = translations[lang].button;
    if(keywordInput) keywordInput.placeholder = translations[lang].keywordPlaceholder;
    if(statusTitle) statusTitle.innerHTML = translations[lang].statusTitle;
    if(statusText) statusText.innerHTML = translations[lang].statusText;
}

setLanguage("tr");