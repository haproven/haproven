// JS file ke andar hi JSON ka link hardcoded rahega
const GLOBAL_JSON_URL = "https://raw.githubusercontent.com/haproven/haproven/main/roots/assets/json/demo.json";

async function loadGlobalWidget() {
    try {
        const response = await fetch(GLOBAL_JSON_URL + "?t=" + new Date().getTime());
        const data = await response.json();

        // 1. JS automatic HTML ke elements dhundega ya create karega
        const targetElement = document.getElementById("global-banner-container");

        if (targetElement) {
            // Dynamic HTML generate karega
            targetElement.innerHTML = `
                <div style="padding: 15px; background: #e3f2fd; border-left: 5px solid #2196f3; font-family: sans-serif;">
                    <h3 style="margin: 0; color: #0d47a1;">${data.siteTitle || 'Announcement'}</h3>
                    <p style="margin: 5px 0 0; color: #1565c0;">${data.announcement || ''}</p>
                </div>
            `;
        }
    } catch (err) {
        console.error("Widget load error:", err);
    }
}

// Auto-run jab script load ho
loadGlobalWidget();
