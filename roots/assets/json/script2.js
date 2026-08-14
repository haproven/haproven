// 1. Aapka RAW JSON Link
const GLOBAL_JSON_URL = "https://raw.githubusercontent.com/haproven/haproven/main/roots/assets/json/demo.json";

async function debugAndLoadData() {
    // Screen par Debugger Box Banana
    let debugBox = document.getElementById("debug-box");
    if (!debugBox) {
        debugBox = document.createElement("div");
        debugBox.id = "debug-box";
        debugBox.style.cssText = "position: fixed; bottom: 20px; right: 20px; width: 350px; padding: 15px; background: #fff; border: 2px solid #333; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-family: monospace; font-size: 13px; z-index: 9999; border-radius: 8px;";
        document.body.appendChild(debugBox);
    }

    debugBox.innerHTML = "<b>🔍 Checking Connection...</b><br>";

    try {
        // STEP 1: Fetching
        debugBox.innerHTML += "<b>Step 1:</b> Requesting JSON URL...<br>";
        const response = await fetch(GLOBAL_JSON_URL + "?t=" + new Date().getTime());

        if (!response.ok) {
            throw new Error(`HTTP Error Code: ${response.status} (Link Sahi Nahi Hai Ya Repo Private Hai)`);
        }
        debugBox.innerHTML += "<span style='color:green;'>✔ Step 1 Passed (URL Working!)</span><br>";

        // STEP 2: JSON Parsing
        debugBox.innerHTML += "<b>Step 2:</b> Reading Data...<br>";
        const data = await response.json();
        debugBox.innerHTML += "<span style='color:green;'>✔ Step 2 Passed (JSON File Readed!)</span><br>";

        // STEP 3: Print Keys (Testing what is inside JSON)
        const keys = Object.keys(data);
        debugBox.innerHTML += `<b>Step 3:</b> Keys Found in JSON: <code style='background:#eee;'>[${keys.join(", ")}]</code><br>`;

        // STEP 4: Render to Webpage
        const targetElement = document.getElementById("global-banner-container") || document.body;
        
        // Dynamic Banner Render
        let titleText = data.siteTitle || data.title || data.name || Object.values(data)[0] || "No Data";
        let bodyText = data.announcement || data.message || data.description || Object.values(data)[1] || "";

        targetElement.innerHTML += `
            <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border-left: 5px solid #2196f3; font-family: sans-serif;">
                <h3 style="margin:0; color:#0d47a1;">${titleText}</h3>
                <p style="margin:5px 0 0; color:#1565c0;">${bodyText}</p>
            </div>
        `;

        debugBox.style.borderColor = "green";
        debugBox.innerHTML += "<b style='color:green; font-size:14px;'>🎉 SUCCESS: Data Screen Par Load Ho Gaya!</b>";

    } catch (error) {
        // ERROR HANDLER (Bataega ki Kya Kharaabi Hai)
        console.error(error);
        debugBox.style.borderColor = "red";
        debugBox.innerHTML += `<br><b style='color:red;'>❌ ERROR AAYA HAI:</b><br><span style='color:red;'>${error.message}</span>`;
    }
}

// Auto Run
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", debugAndLoadData);
} else {
    debugAndLoadData();
}
