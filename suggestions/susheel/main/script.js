(function () {
    "use strict";

    /* =====================================================
       HAPROVEN FRAME v4
       Faster + SEO-friendly + Smart Cache
    ===================================================== */

    const REPOSITORY = "haproven/haproven";
    const frame = document.getElementById("haprovenFrame");

    if (!frame) {
        console.error("Haproven Frame: #haprovenFrame not found.");
        return;
    }

    /* =====================================================
       SETTINGS
    ===================================================== */

    const REFRESH_INTERVAL = 15 * 60 * 1000;          // 15 min
    const PROFILE_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24h

    const CONTRIBUTORS_KEY = "haproven_frame_smart_contributors_v4";
    const PROFILE_PREFIX = "haproven_frame_smart_profile_v4_";
    const RATE_LIMIT_KEY = "haproven_frame_rate_limit_v4";

    // Parallel profile fetch (safe for rate limit)
    const PARALLEL_LIMIT = 4;

    /* =====================================================
       SAFE STORAGE
    ===================================================== */

    function readStorage(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.warn("Haproven Frame: Storage read failed", e);
            return null;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn("Haproven Frame: Storage write failed", e);
            return false;
        }
    }

    /* =====================================================
       RATE LIMIT
    ===================================================== */

    function getRateLimitBlock() {
        const data = readStorage(RATE_LIMIT_KEY);
        if (!data || !data.reset) return null;

        const reset = Number(data.reset);
        if (!Number.isFinite(reset) || Date.now() >= reset) {
            try { localStorage.removeItem(RATE_LIMIT_KEY); } catch (_) {}
            return null;
        }
        return data;
    }

    function saveRateLimit(resetSeconds) {
        const seconds = Number(resetSeconds);
        if (!Number.isFinite(seconds) || seconds <= 0) return;

        const reset = seconds * 1000;
        writeStorage(RATE_LIMIT_KEY, { reset });
        console.warn("Haproven Frame: Rate limit until", new Date(reset).toLocaleString());
    }

    /* =====================================================
       PROFILE CACHE
    ===================================================== */

    function profileKey(username) {
        return PROFILE_PREFIX + String(username).toLowerCase();
    }

    function getCachedProfile(username) {
        const cache = readStorage(profileKey(username));
        if (!cache || !cache.time || !cache.profile) return null;

        const age = Date.now() - Number(cache.time);
        if (!Number.isFinite(age) || age > PROFILE_REFRESH_INTERVAL) return null;

        return cache.profile;
    }

    function saveProfile(username, profile) {
        if (!profile) return;
        writeStorage(profileKey(username), {
            time: Date.now(),
            profile
        });
    }

    /* =====================================================
       CREATE MEMBER CARD (SEO optimized)
    ===================================================== */

    function createMemberCard(contributor) {
        const username = contributor.login || "unknown";
        const displayName = contributor.name || username;
        const githubURL = contributor.html_url || `https://github.com/${encodeURIComponent(username)}`;
        const bio = contributor.bio || "Haproven contributor";
        const contributions = Number(contributor.contributions || 0).toLocaleString();

        const link = document.createElement("a");
        link.className = "haproven-member";
        link.href = githubURL;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.title = `${displayName} (@${username}) — Haproven Contributor`;
        link.setAttribute("itemprop", "contributor");
        link.setAttribute("itemscope", "");
        link.setAttribute("itemtype", "https://schema.org/Person");

        // Avatar
        const image = document.createElement("img");
        image.className = "member-avatar";
        image.src = contributor.avatar_url || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
        image.alt = `${displayName} — Haproven Contributor`;
        image.loading = "lazy";
        image.decoding = "async";
        image.width = 80;
        image.height = 80;
        image.referrerPolicy = "no-referrer";
        image.setAttribute("itemprop", "image");

        // Name
        const name = document.createElement("div");
        name.className = "member-name";
        name.textContent = displayName;
        name.setAttribute("itemprop", "name");

        // Username
        const usernameEl = document.createElement("div");
        usernameEl.className = "member-username";
        usernameEl.textContent = `@${username}`;
        usernameEl.setAttribute("itemprop", "alternateName");

        // Bio
        const bioEl = document.createElement("div");
        bioEl.className = "member-bio" + (contributor.bio ? "" : " no-bio");
        bioEl.textContent = bio;
        bioEl.setAttribute("itemprop", "description");

        // Bottom
        const bottom = document.createElement("div");
        bottom.className = "member-bottom";

        const github = document.createElement("span");
        github.className = "member-github";
        github.textContent = "GitHub";
        github.setAttribute("aria-label", "View on GitHub");

        const contrib = document.createElement("span");
        contrib.className = "member-contributions";
        contrib.textContent = `${contributions} contributions`;
        contrib.setAttribute("itemprop", "interactionStatistic");

        bottom.append(github, contrib);

        link.append(image, name, usernameEl, bioEl, bottom);
        return link;
    }

    /* =====================================================
       RENDER
    ===================================================== */

    function render(contributors) {
        if (!Array.isArray(contributors) || contributors.length === 0) {
            frame.innerHTML = `
                <div class="frame-loading" role="status">
                    No contributors found yet.
                </div>
            `;
            return;
        }

        // SEO: keep text content for crawlers
        const fragment = document.createDocumentFragment();
        contributors.forEach(c => fragment.appendChild(createMemberCard(c)));

        frame.replaceChildren(fragment);
        frame.setAttribute("itemscope", "");
        frame.setAttribute("itemtype", "https://schema.org/ItemList");
    }

    /* =====================================================
       GITHUB REQUEST
    ===================================================== */

    async function githubRequest(url) {
        if (getRateLimitBlock()) {
            const err = new Error("GitHub rate limit locally blocked.");
            err.rateLimited = true;
            throw err;
        }

        let response;
        try {
            response = await fetch(url, {
                method: "GET",
                headers: { "Accept": "application/vnd.github+json" },
                cache: "no-store"
            });
        } catch (e) {
            const err = new Error("Unable to connect to GitHub.");
            err.network = true;
            throw err;
        }

        const remaining = response.headers.get("x-ratelimit-remaining");
        const reset = response.headers.get("x-ratelimit-reset");

        if (response.status === 403 || response.status === 429 || remaining === "0") {
            saveRateLimit(reset);
            const err = new Error("GitHub API rate limit reached.");
            err.rateLimited = true;
            err.status = response.status;
            throw err;
        }

        if (!response.ok) {
            const err = new Error("GitHub API error: " + response.status);
            err.status = response.status;
            throw err;
        }

        return response.json();
    }

    /* =====================================================
       FETCH CONTRIBUTORS
    ===================================================== */

    async function fetchContributors() {
        const url = `https://api.github.com/repos/${REPOSITORY}/contributors?per_page=100`;
        return githubRequest(url);
    }

    /* =====================================================
       FETCH PROFILE (with cache)
    ===================================================== */

    async function fetchProfile(username) {
        const cached = getCachedProfile(username);
        if (cached) return cached;

        if (getRateLimitBlock()) return null;

        try {
            const profile = await githubRequest(
                `https://api.github.com/users/${encodeURIComponent(username)}`
            );
            saveProfile(username, profile);
            return profile;
        } catch (e) {
            console.warn("Haproven Frame: Profile skipped →", username);
            return null;
        }
    }

    /* =====================================================
       FAST PARALLEL ENRICHMENT
    ===================================================== */

    async function enrichContributors(contributors) {
        const results = new Array(contributors.length);

        // Process in batches
        for (let i = 0; i < contributors.length; i += PARALLEL_LIMIT) {
            if (getRateLimitBlock()) break;

            const batch = contributors.slice(i, i + PARALLEL_LIMIT);

            const promises = batch.map(async (contributor, idx) => {
                const realIdx = i + idx;
                let result = { ...contributor };

                if (contributor.login) {
                    const profile = await fetchProfile(contributor.login);
                    if (profile) {
                        result = {
                            ...result,
                            name: profile.name || contributor.login,
                            bio: profile.bio || "",
                            avatar_url: profile.avatar_url || contributor.avatar_url,
                            html_url: profile.html_url || contributor.html_url
                        };
                    }
                }
                results[realIdx] = result;
            });

            await Promise.all(promises);

            // Tiny delay only between batches (rate-limit friendly)
            if (i + PARALLEL_LIMIT < contributors.length) {
                await new Promise(r => setTimeout(r, 80));
            }
        }

        // Fill any missing
        for (let i = 0; i < contributors.length; i++) {
            if (!results[i]) results[i] = contributors[i];
        }

        return results;
    }

    /* =====================================================
       CACHE HELPERS
    ===================================================== */

    function saveContributors(contributors) {
        writeStorage(CONTRIBUTORS_KEY, {
            time: Date.now(),
            contributors
        });
    }

    function getContributorCache() {
        return readStorage(CONTRIBUTORS_KEY);
    }

    function shouldRefresh() {
        const cache = getContributorCache();
        if (!cache || !cache.time) return true;

        const age = Date.now() - Number(cache.time);
        return !Number.isFinite(age) || age >= REFRESH_INTERVAL;
    }

    function contributorsChanged(oldList, newList) {
        if (!Array.isArray(oldList) || !Array.isArray(newList)) return true;
        if (oldList.length !== newList.length) return true;

        const oldMap = new Map();
        oldList.forEach(c => {
            if (c?.login) oldMap.set(c.login, c);
        });

        for (const c of newList) {
            if (!c?.login) continue;
            const old = oldMap.get(c.login);
            if (!old) return true;
            if (Number(old.contributions || 0) !== Number(c.contributions || 0)) return true;
            if (old.avatar_url !== c.avatar_url) return true;
        }
        return false;
    }

    /* =====================================================
       UPDATE FROM GITHUB
    ===================================================== */

    async function updateFromGitHub() {
        if (getRateLimitBlock()) {
            console.log("Haproven Frame: Rate limit active. Using cache.");
            return false;
        }

        try {
            console.log("Haproven Frame: Checking GitHub...");

            const latest = await fetchContributors();
            if (!Array.isArray(latest)) return false;

            const oldCache = getContributorCache();
            const oldContributors = Array.isArray(oldCache?.contributors)
                ? oldCache.contributors
                : [];

            const changed = contributorsChanged(oldContributors, latest);

            if (!changed && oldContributors.length > 0) {
                console.log("Haproven Frame: No changes.");
                // Refresh timestamp only
                saveContributors(oldContributors);
                return true;
            }

            console.log("Haproven Frame: Changes detected.");

            // Show basic data immediately (fast)
            render(latest);

            // Enrich in background (parallel + fast)
            const enriched = await enrichContributors(latest);
            saveContributors(enriched);
            render(enriched);

            console.log("Haproven Frame: Updated successfully.");
            return true;

        } catch (error) {
            console.warn("Haproven Frame: Update skipped.", error);

            const cache = getContributorCache();
            if (cache?.contributors?.length) {
                render(cache.contributors);
            }
            return false;
        }
    }

    /* =====================================================
       INITIAL LOAD (FAST)
    ===================================================== */

    async function start() {
        const cache = getContributorCache();

        // 1. Instant render from cache (best UX)
        if (cache?.contributors?.length > 0) {
            render(cache.contributors);

            // Background refresh if needed
            if (shouldRefresh()) {
                // Don't await → page stays fast
                updateFromGitHub();
            }
            return;
        }

        // 2. No cache → show loading only once
        frame.innerHTML = `
            <div class="frame-loading" role="status" aria-live="polite">
                Loading contributors
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
            </div>
        `;

        await updateFromGitHub();

        // Final fallback
        const finalCache = getContributorCache();
        if (!finalCache?.contributors?.length) {
            frame.innerHTML = `
                <div class="frame-loading">
                    Unable to load contributors.<br><br>
                    <a href="https://github.com/haproven/haproven/graphs/contributors"
                       target="_blank" rel="noopener noreferrer">
                        View contributors on GitHub →
                    </a>
                </div>
            `;
        }
    }

    // Start immediately
    start();

})();