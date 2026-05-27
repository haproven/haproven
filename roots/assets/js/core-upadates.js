
/*================================================
////////     live-text  upade aside      //////////
=================================================*/
async function loadSidebarLive() {
    const text = document.getElementById("live-text");
    try {
        const res = await fetch("./assets/json/core-updates.json");
        const data = await res.json();
        text.textContent = data.liveText;
    } catch (error) {
        text.textContent = "Unable to load content.❤️";
    }
}
loadSidebarLive();







/*===========================================================
////////    by-haproven ,  new haproven web add    //////////
============================================================*/
async function loadByHaproven() {
    const container = document.getElementById("by-haproven");
    try {
        const res = await fetch("./assets/json/core-updates.json");
        const data = await res.json();
        container.innerHTML = "";
        data.projects.forEach(item => {
            const a = document.createElement("a");
            a.className = "member-box";
            a.href = item.url;
            a.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <span>${item.name}</span>
            `;
            container.appendChild(a);
        });

    } catch (err) {
        console.error("Failed to load projects:", err);
    }
}
loadByHaproven();







/*===========================================================
////////   CORE UPDATES ,  new haproven web add    //////////
============================================================*/
async function loadUpdates() {
    const container = document.getElementById("core-updates");
    try {
        const res = await fetch("./assets/json/core-updates.json");
        const data = await res.json();
        container.innerHTML = "";
        data.updates.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("update-card");
            card.innerHTML = `
                <span class="update-badge">${item.badge}</span>
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.log(err);
        container.innerHTML = "<p>Failed to load data</p>";
    }
}

loadUpdates();






/*===========================================================
////////   ABOUT STATS ,  new haproven web add    //////////
============================================================*/
async function loadStats() {
    const container = document.getElementById("about-stats");
    try {
        const res = await fetch("./assets/json/core-updates.json");
        const data = await res.json();
        container.innerHTML = "";
        data.stats.forEach(item => {
            const box = document.createElement("div");
            box.classList.add("stat-box");

            box.innerHTML = `
                <h2>${item.value}</h2>
                <span>${item.label}</span>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        console.log(error);
        container.innerHTML = "<p>Stats load failed</p>";
    }
}
loadStats();










