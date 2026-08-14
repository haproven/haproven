const GLOBAL_JSON_URL = "https://raw.githubusercontent.com/haproven/haproven/main/roots/assets/json/demo.json";

async function fetchGlobalData() {
    const statusEl = document.getElementById("status");
    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("description");
    const versionEl = document.getElementById("version");
    const authorEl = document.getElementById("author");
    const updatedEl = document.getElementById("updated");

    statusEl.className = "status-badge loading";
    statusEl.innerText = "Connecting...";

    try {
        const response = await fetch(GLOBAL_JSON_URL + "?t=" + new Date().getTime());

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        // --- YE CONSOLE LOG AAPKO DIKHAYEGA KI DATA KYA AAYA HAI ---
        console.log("JSON se ye data mila:", data);

        // Agar JSON me keys alag hain toh fallback (||) use hoga
        titleEl.innerText = data.siteTitle || data.title || data.name || "No Title Found";
        descEl.innerText = data.announcement || data.message || data.description || "No Content Found";
        versionEl.innerText = data.version || "N/A";
        authorEl.innerText = data.author || "N/A";
        updatedEl.innerText = data.lastUpdated || "N/A";

        statusEl.className = "status-badge success";
        statusEl.innerText = "Connected & Data Loaded";

    } catch (error) {
        console.error("Fetch Error:", error);
        titleEl.innerText = "Connection Failed";
        statusEl.className = "status-badge error";
        statusEl.innerText = "Fetch Error";
    }
}

document.addEventListener("DOMContentLoaded", fetchGlobalData);
