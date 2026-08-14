// ======================================================
// CONFIGURATION: Replace with your actual RAW JSON URL
// ======================================================
const GLOBAL_JSON_URL = "demo.json";

/**
 * Function to fetch global data from the JSON file
 */
async function fetchGlobalData() {
    const statusEl = document.getElementById("status");
    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("description");
    const versionEl = document.getElementById("version");
    const authorEl = document.getElementById("author");
    const updatedEl = document.getElementById("updated");

    // Show loading state
    statusEl.className = "status-badge loading";
    statusEl.innerText = "Connecting...";

    try {
        // Cache bypass parameter added to ensure fresh data
        const cacheBuster = "?t=" + new Date().getTime();
        const response = await fetch(GLOBAL_JSON_URL + cacheBuster);

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Update HTML elements with JSON data
        titleEl.innerText = data.siteTitle || "No Title";
        descEl.innerText = data.announcement || "No announcement available.";
        versionEl.innerText = data.version || "N/A";
        authorEl.innerText = data.author || "N/A";
        updatedEl.innerText = data.lastUpdated || "N/A";

        // Success State
        statusEl.className = "status-badge success";
        statusEl.innerText = "Connected & Updated";

    } catch (error) {
        console.error("Fetch Error:", error);

        // Error State Display
        titleEl.innerText = "Connection Failed";
        descEl.innerText = "Unable to fetch data from the provided JSON URL. Make sure the URL is valid and accessible.";
        statusEl.className = "status-badge error";
        statusEl.innerText = "Fetch Error";
    }
}

// Initial fetch when page loads
document.addEventListener("DOMContentLoaded", fetchGlobalData);
