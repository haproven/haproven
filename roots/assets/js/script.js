

//  @ 2026 ya 2027 year auto upadet
document.getElementById("year").textContent = new Date().getFullYear();



// dot6menu button
const menuBtn = document.getElementById("dot6menu");
const dropdown = document.getElementById("teamDropdown");
menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
});
document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
    }
});






/* ========================================
MOBILE MENU TOGGLE , 2nd impostant page 
===========================================*/
const toggleBtn = document.querySelector(".menu-toggle");
const nav = document.getElementById("navbar-mobile");
toggleBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("show");

    document.body.style.overflow = isOpen ? "hidden" : "";
});
document.addEventListener("click", (e) => {
    if (!toggleBtn.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove("show");
        document.body.style.overflow = "";
    }
});
document.querySelectorAll(".dropdown").forEach(drop => {
    drop.addEventListener("click", () => {
        drop.classList.toggle("open");
    });
});
window.addEventListener("resize", () => {
    if (window.innerWidth > 2200) {
        nav.classList.remove("show");
        document.body.style.overflow = "";
    }
});





/*========================
Day and Night mode ,
==========================*/
const toggleButton = document.getElementById('theme-toggle');
function setTheme(mode) {
    if (mode === "dark") {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", mode);
    updateIcons(mode);
}
function updateIcons(mode) {
    const sun = document.querySelector(".sun");
    const moon = document.querySelector(".moon");

    if (mode === "dark") {
        sun.style.display = "none";
        moon.style.display = "inline";
    } else {
        sun.style.display = "inline";
        moon.style.display = "none";
    }
}
let savedTheme = localStorage.getItem("theme");

if (savedTheme) {
    setTheme(savedTheme);
} else {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(systemDark ? "dark" : "light");
}
toggleButton.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    setTheme(isDark ? "light" : "dark");
});












/*/////////////////////
    hindi to english  ,data-hi=" हिंदी Text"
//////////////////////*/
let isHindi = localStorage.getItem("lang") === "hi";
function applyLanguage() {
    const elements = document.querySelectorAll("[data-hi]");
    const btn = document.getElementById("langBtn");
    elements.forEach(el => {
        if (isHindi) {
            el.dataset.en = el.dataset.en || el.textContent;
            el.textContent = el.getAttribute("data-hi");
        } else {
            if (el.dataset.en) {
                el.textContent = el.dataset.en;
            }
        }
    });
    btn.textContent = isHindi ? "Eng." : "हिंदी";
}
function toggleLanguage() {
    isHindi = !isHindi;
    localStorage.setItem("lang", isHindi ? "hi" : "en");
    applyLanguage();
}
document.addEventListener("DOMContentLoaded", applyLanguage);













/*///////////////////////////////////////////
========       haproven icon        ========
///////////////////////////////////////////*/

(function () {
    if (document.querySelector("#haproven-brand-style")) return;
    const style = document.createElement("style");
    style.id = "haproven-brand-style";
    style.innerHTML = `
    :root{
        --hap-purple:#bc1be7;
    }
    .haproven-brand{
        display:flex;
        align-items:center;
        width:max-content;
        font-family:Inter, system-ui, sans-serif;
        cursor:pointer;
        user-select:none;
        transition:transform .25s ease;
    }
    .haproven-brand:active{
        transform:scale(.96);
    }
    .haproven-icon{
        position:relative;
        width:46px;
        height:60px;
        display:flex;
        align-items:center;
        justify-content:center;
        flex-shrink:0;
        transition:transform .3s ease;
    }
    .haproven-brand:hover .haproven-icon{
        transform:scale(1.06);
    }
    .shadow-layer{
        position:absolute;
        width:42px;
        height:56px;
        top:-3px;
        left:-3px;
        opacity:.35;
        background:
        linear-gradient(135deg, var(--hap-purple), #ffffff55);
        clip-path:polygon(
            0 0,
            100% 0,
            100% 100%,
            50% 88%,
            0 100%
        );
        border-radius:8px 8px 0 0;
    }
    .main-bookmark{
        position:relative;
        width:38px;
        height:52px;
        background:
        linear-gradient(135deg, var(--hap-purple), #d94dff);
        clip-path:polygon(
            0 0,
            100% 0,
            100% 100%,
            50% 88%,
            0 100%
        );
        border-radius:8px 8px 0 0;
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:2;
        box-shadow:
        0 10px 25px rgba(188,27,231,.35);
    }

    .haproven-icon svg{
        width:40px;
        height:40px;
        margin-right:-5px;
        fill:none;
    }
    .path-line{
        stroke:#fff;
        stroke-width:6;
        stroke-linecap:round;
        stroke-linejoin:round;
        stroke-dasharray:260;
        stroke-dashoffset:260;
        animation:hapDraw 2.8s ease-in-out infinite;
    }

    .brand-bar{
        min-height:38px;
        padding:3px 10px;
        display:flex;
        align-items:center;
        margin-left:-3px;
        border-radius:0 12px 12px 0;
        border:3px solid var(--hap-purple);
        border-left:none;
        background:rgba(10,10,10,.88);
        backdrop-filter:blur(12px);
    }
    .brand-text{
        display:flex;
        flex-direction:column;
        line-height:1;
    }
    .brand-text strong{
        font-size:13.5px;
        font-weight:900;
        color:#fff;
        letter-spacing:.4px;
    }
    .brand-text small{
        font-size:10px;
        font-weight:600;
        opacity:.7;
        margin-top:3px;
        letter-spacing:.5px;
        text-transform:uppercase;
    }
    .haproven-brand:hover .main-bookmark{
        box-shadow:
        0 0 25px rgba(188,27,231,.6),
        0 10px 30px rgba(188,27,231,.3);
    }
    .haproven-brand.icon-only .brand-bar{
        display:none;
    }

    @keyframes hapDraw{
        0%{
            stroke-dashoffset:260;
            opacity:0.6;
        }
        50%{
            stroke-dashoffset:0;
            opacity:1;
        }
        100%{
            stroke-dashoffset:-260;
            opacity:0.6;
        }
    }

    `;
    document.head.appendChild(style);
    function initBrand(el){
        const brandName = el.dataset.name || "Haproven";
        const parts = brandName.split(" by ");
        let finalName = `<strong>${brandName}</strong>`;
        if(parts.length > 1){
            finalName = `
                <strong>${parts[0]}</strong>
                <small>by ${parts[1]}</small>
            `;
        }
        el.innerHTML = `
        <div class="haproven-icon">
            <div class="shadow-layer"></div>
            <div class="main-bookmark">
                <svg viewBox="0 0 100 100">
                    <path class="path-line"
                        d="
                        M10 0 L10 70
                        A10 10 0 0 0 30 70
                        L30 20
                        A10 10 0 0 1 50 20
                        L50 70
                        A16 9 0 0 0 70 80
                        A13 20 0 0 1 80 94
                        L100 95
                        "
                    />
                </svg>
            </div>
        </div>
        <div class="brand-bar">
            <span class="brand-text">
                ${finalName}
            </span>
        </div>
        `;
    }
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(".haproven-brand").forEach(initBrand);
    });

})();



