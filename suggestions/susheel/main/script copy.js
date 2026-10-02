(function () {
    "use strict";

    /* =====================================================
       HAPROVEN FRAME
       Smart GitHub Contributor System
       Cache + Rate Limit Protection + Auto Update
    ===================================================== */

    const REPOSITORY = "haproven/haproven";

    const frame = document.getElementById("haprovenFrame");

    if (!frame) {
        console.error(
            "Haproven Frame: #haprovenFrame not found."
        );
        return;
    }


    /* =====================================================
       SETTINGS
    ===================================================== */

    // GitHub contributors API:
    // Maximum once every 15 minutes
    const REFRESH_INTERVAL =
        15 * 60 * 1000;

    // GitHub profile cache:
    // 24 hours
    const PROFILE_REFRESH_INTERVAL =
        24 * 60 * 60 * 1000;

    const CONTRIBUTORS_KEY =
        "haproven_frame_smart_contributors_v3";

    const PROFILE_PREFIX =
        "haproven_frame_smart_profile_v3_";

    const RATE_LIMIT_KEY =
        "haproven_frame_rate_limit_v3";


    /* =====================================================
       SAFE STORAGE
    ===================================================== */

    function readStorage(key) {

        try {

            const value =
                localStorage.getItem(key);

            if (!value) {
                return null;
            }

            return JSON.parse(value);

        } catch (error) {

            console.warn(
                "Haproven Frame: Storage read failed.",
                error
            );

            return null;
        }
    }


    function writeStorage(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.warn(
                "Haproven Frame: Storage write failed.",
                error
            );

            return false;
        }
    }


    /* =====================================================
       RATE LIMIT
    ===================================================== */

    function getRateLimitBlock() {

        const data =
            readStorage(
                RATE_LIMIT_KEY
            );

        if (
            !data ||
            !data.reset
        ) {
            return null;
        }


        const reset =
            Number(data.reset);


        if (
            !Number.isFinite(reset) ||
            Date.now() >= reset
        ) {

            try {

                localStorage.removeItem(
                    RATE_LIMIT_KEY
                );

            } catch (error) { }

            return null;
        }


        return data;
    }


    function saveRateLimit(resetSeconds) {

        const seconds =
            Number(resetSeconds);


        if (
            !Number.isFinite(seconds) ||
            seconds <= 0
        ) {
            return;
        }


        const reset =
            seconds * 1000;


        writeStorage(
            RATE_LIMIT_KEY,
            {
                reset: reset
            }
        );


        console.warn(
            "Haproven Frame: GitHub rate limit active until",
            new Date(reset).toLocaleString()
        );
    }


    /* =====================================================
       PROFILE CACHE
    ===================================================== */

    function profileKey(username) {

        return (
            PROFILE_PREFIX +
            String(username).toLowerCase()
        );
    }


    function getCachedProfile(username) {

        const cache =
            readStorage(
                profileKey(username)
            );


        if (!cache) {
            return null;
        }


        if (
            !cache.time ||
            !cache.profile
        ) {
            return null;
        }


        const age =
            Date.now() -
            Number(cache.time);


        if (
            !Number.isFinite(age) ||
            age > PROFILE_REFRESH_INTERVAL
        ) {
            return null;
        }


        return cache.profile;
    }


    function saveProfile(
        username,
        profile
    ) {

        if (!profile) {
            return;
        }


        writeStorage(
            profileKey(username),
            {
                time: Date.now(),
                profile: profile
            }
        );
    }


    /* =====================================================
       CREATE MEMBER CARD
    ===================================================== */

    function createMemberCard(
        contributor
    ) {

        const username =
            contributor.login ||
            "unknown";


        const githubURL =
            contributor.html_url ||
            (
                "https://github.com/" +
                encodeURIComponent(username)
            );


        /* ===============================
           CARD
        =============================== */

        const link =
            document.createElement("a");

        link.className =
            "haproven-member";

        link.href =
            githubURL;

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";

        link.title =
            username +
            " — Haproven Contributor";


        /* ===============================
           PHOTO
        =============================== */

        const image =
            document.createElement("img");

        image.className =
            "member-avatar";

        image.src =
            contributor.avatar_url ||
            (
                "https://github.githubassets.com/" +
                "images/modules/logos_page/GitHub-Mark.png"
            );

        image.alt =
            (
                contributor.name ||
                username
            ) +
            " — Haproven Contributor";

        image.loading =
            "lazy";

        image.referrerPolicy =
            "no-referrer";


        /* ===============================
           NAME
        =============================== */

        const name =
            document.createElement("div");

        name.className =
            "member-name";

        name.textContent =
            contributor.name ||
            username;


        /* ===============================
           USERNAME
        =============================== */

        const usernameElement =
            document.createElement("div");

        usernameElement.className =
            "member-username";

        usernameElement.textContent =
            "@" + username;


        /* ===============================
           BIO
        =============================== */

        const bio =
            document.createElement("div");

        bio.className =
            "member-bio";


        if (contributor.bio) {

            bio.textContent =
                contributor.bio;

        } else {

            bio.textContent =
                "Haproven contributor";

            bio.classList.add(
                "no-bio"
            );
        }


        /* ===============================
           BOTTOM
        =============================== */

        const bottom =
            document.createElement("div");

        bottom.className =
            "member-bottom";


        const github =
            document.createElement("span");

        github.className =
            "member-github";

        github.textContent =
            "🐙 GitHub";


        const contributions =
            document.createElement("span");

        contributions.className =
            "member-contributions";

        contributions.textContent =
            Number(
                contributor.contributions || 0
            ).toLocaleString() +
            " contributions";


        bottom.appendChild(
            github
        );

        bottom.appendChild(
            contributions
        );


        /* ===============================
           APPEND
        =============================== */

        link.appendChild(
            image
        );

        link.appendChild(
            name
        );

        link.appendChild(
            usernameElement
        );

        link.appendChild(
            bio
        );

        link.appendChild(
            bottom
        );


        return link;
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function render(
        contributors
    ) {

        if (
            !Array.isArray(contributors) ||
            contributors.length === 0
        ) {

            frame.innerHTML = `
                <div class="frame-loading">
                    No contributors found yet.
                </div>
            `;

            return;
        }


        const fragment =
            document.createDocumentFragment();


        contributors.forEach(
            function (contributor) {

                fragment.appendChild(
                    createMemberCard(
                        contributor
                    )
                );

            }
        );


        frame.replaceChildren(
            fragment
        );
    }


    /* =====================================================
       GITHUB REQUEST
    ===================================================== */

    async function githubRequest(
        url
    ) {

        /* ===============================
           LOCAL RATE LIMIT CHECK
        =============================== */

        if (
            getRateLimitBlock()
        ) {

            const error =
                new Error(
                    "GitHub rate limit locally blocked."
                );

            error.rateLimited =
                true;

            throw error;
        }


        /* ===============================
           REQUEST
        =============================== */

        let response;


        try {

            response =
                await fetch(
                    url,
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/vnd.github+json"
                        },

                        cache: "no-store"
                    }
                );

        } catch (error) {

            const networkError =
                new Error(
                    "Unable to connect to GitHub."
                );

            networkError.network =
                true;

            throw networkError;
        }


        /* ===============================
           RATE LIMIT HEADERS
        =============================== */

        const remaining =
            response.headers.get(
                "x-ratelimit-remaining"
            );

        const reset =
            response.headers.get(
                "x-ratelimit-reset"
            );


        /* ===============================
           RATE LIMIT
        =============================== */

        if (
            response.status === 403 ||
            response.status === 429 ||
            remaining === "0"
        ) {

            saveRateLimit(
                reset
            );


            const error =
                new Error(
                    "GitHub API rate limit reached."
                );

            error.rateLimited =
                true;

            error.status =
                response.status;

            throw error;
        }


        /* ===============================
           OTHER ERROR
        =============================== */

        if (!response.ok) {

            const error =
                new Error(
                    "GitHub API error: " +
                    response.status
                );

            error.status =
                response.status;

            throw error;
        }


        return await response.json();
    }


    /* =====================================================
       FETCH CONTRIBUTORS
    ===================================================== */

    async function fetchContributors() {

        const url =
            "https://api.github.com/repos/" +
            REPOSITORY +
            "/contributors?per_page=100";


        return await githubRequest(
            url
        );
    }


    /* =====================================================
       FETCH PROFILE
    ===================================================== */

    async function fetchProfile(
        username
    ) {

        /* ===============================
           CACHE FIRST
        =============================== */

        const cached =
            getCachedProfile(
                username
            );


        if (cached) {

            return cached;
        }


        /* ===============================
           RATE LIMIT
        =============================== */

        if (
            getRateLimitBlock()
        ) {

            return null;
        }


        try {

            const url =
                "https://api.github.com/users/" +
                encodeURIComponent(username);


            const profile =
                await githubRequest(
                    url
                );


            saveProfile(
                username,
                profile
            );


            return profile;

        } catch (error) {

            console.warn(
                "Haproven Frame: Profile skipped → " +
                username
            );

            return null;
        }
    }


    /* =====================================================
       ENRICH CONTRIBUTORS
    ===================================================== */

    async function enrichContributors(
        contributors
    ) {

        const output = [];


        for (
            const contributor of contributors
        ) {

            let result = {
                ...contributor
            };


            if (
                contributor.login &&
                !getRateLimitBlock()
            ) {

                const profile =
                    await fetchProfile(
                        contributor.login
                    );


                if (profile) {

                    result = {

                        ...result,

                        name:
                            profile.name ||
                            contributor.login,

                        bio:
                            profile.bio ||
                            "",

                        avatar_url:
                            profile.avatar_url ||
                            contributor.avatar_url,

                        html_url:
                            profile.html_url ||
                            contributor.html_url
                    };
                }
            }


            output.push(
                result
            );


            /*
                Small delay.
                Prevents a huge request burst.
            */

            await new Promise(
                function (resolve) {

                    setTimeout(
                        resolve,
                        200
                    );

                }
            );
        }


        return output;
    }


    /* =====================================================
       CONTRIBUTOR CACHE
    ===================================================== */

    function saveContributors(
        contributors
    ) {

        writeStorage(
            CONTRIBUTORS_KEY,
            {
                time: Date.now(),
                contributors: contributors
            }
        );
    }


    function getContributorCache() {

        return readStorage(
            CONTRIBUTORS_KEY
        );
    }


    function shouldRefresh() {

        const cache =
            getContributorCache();


        if (!cache) {
            return true;
        }


        if (
            !cache.time
        ) {
            return true;
        }


        const age =
            Date.now() -
            Number(cache.time);


        return (
            !Number.isFinite(age) ||
            age >= REFRESH_INTERVAL
        );
    }


    /* =====================================================
       CHECK CHANGES
    ===================================================== */

    function contributorsChanged(
        oldContributors,
        latestContributors
    ) {

        if (
            !Array.isArray(
                oldContributors
            ) ||
            !Array.isArray(
                latestContributors
            )
        ) {

            return true;
        }


        /* ===============================
           COUNT CHANGED
        =============================== */

        if (
            oldContributors.length !==
            latestContributors.length
        ) {

            return true;
        }


        /* ===============================
           OLD MAP
        =============================== */

        const oldMap =
            new Map();


        oldContributors.forEach(
            function (contributor) {

                if (
                    contributor &&
                    contributor.login
                ) {

                    oldMap.set(
                        contributor.login,
                        contributor
                    );
                }

            }
        );


        /* ===============================
           COMPARE
        =============================== */

        for (
            const contributor of
            latestContributors
        ) {

            if (
                !contributor ||
                !contributor.login
            ) {

                continue;
            }


            const old =
                oldMap.get(
                    contributor.login
                );


            /* New contributor */

            if (!old) {

                return true;
            }


            /* Contributions changed */

            if (
                Number(
                    old.contributions || 0
                ) !==
                Number(
                    contributor.contributions || 0
                )
            ) {

                return true;
            }


            /* Avatar changed */

            if (
                old.avatar_url !==
                contributor.avatar_url
            ) {

                return true;
            }
        }


        return false;
    }


    /* =====================================================
       UPDATE FROM GITHUB
    ===================================================== */

    async function updateFromGitHub() {

        /* ===============================
           RATE LIMIT
        =============================== */

        if (
            getRateLimitBlock()
        ) {

            console.log(
                "Haproven Frame: GitHub rate limit active. Cache kept."
            );

            return false;
        }


        try {

            console.log(
                "Haproven Frame: Checking GitHub..."
            );


            /* ===============================
               GET LATEST CONTRIBUTORS
            =============================== */

            const latest =
                await fetchContributors();


            if (
                !Array.isArray(latest)
            ) {

                return false;
            }


            /* ===============================
               OLD CACHE
            =============================== */

            const oldCache =
                getContributorCache();


            const oldContributors =
                Array.isArray(
                    oldCache?.contributors
                )
                    ? oldCache.contributors
                    : [];


            /* ===============================
               CHECK CHANGES
            =============================== */

            const changed =
                contributorsChanged(
                    oldContributors,
                    latest
                );


            /* ===============================
               NO CHANGE
            =============================== */

            if (
                !changed &&
                oldContributors.length > 0
            ) {

                console.log(
                    "Haproven Frame: No changes found."
                );


                /*
                    Update timestamp only.
 
                    This prevents another GitHub
                    request for 15 minutes.
                */

                saveContributors(
                    oldContributors
                );


                return true;
            }


            /* ===============================
               CHANGES FOUND
            =============================== */

            console.log(
                "Haproven Frame: New/update detected."
            );


            /*
                Show latest GitHub data immediately.
            */

            render(
                latest
            );


            /* ===============================
               PROFILE DATA
            =============================== */

            const enriched =
                await enrichContributors(
                    latest
                );


            /* ===============================
               SAVE
            =============================== */

            saveContributors(
                enriched
            );


            /* ===============================
               FINAL RENDER
            =============================== */

            render(
                enriched
            );


            console.log(
                "Haproven Frame: Updated successfully."
            );


            return true;

        } catch (error) {

            console.warn(
                "Haproven Frame: GitHub update skipped.",
                error
            );


            /*
                IMPORTANT:
 
                Never remove existing cached
                contributors if GitHub fails.
            */

            const cache =
                getContributorCache();


            if (
                cache &&
                Array.isArray(
                    cache.contributors
                )
            ) {

                render(
                    cache.contributors
                );

                return false;
            }


            return false;
        }
    }


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    async function start() {

        const cache =
            getContributorCache();


        /* ===============================
           CACHE EXISTS
        =============================== */

        if (
            cache &&
            Array.isArray(
                cache.contributors
            ) &&
            cache.contributors.length > 0
        ) {

            /*
                Show cached data immediately.
            */

            render(
                cache.contributors
            );


            /*
                GitHub check only after
                15 minutes.
            */

            if (
                shouldRefresh()
            ) {

                /*
                    Do not block page rendering.
                */

                updateFromGitHub();
            }


            return;
        }


        /* ===============================
           NO CACHE
        =============================== */

        frame.innerHTML = `
            <div class="frame-loading">
                Loading contributors
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
            </div>
        `;


        await updateFromGitHub();


        /* ===============================
           FINAL FALLBACK
        =============================== */

        const finalCache =
            getContributorCache();


        if (
            !finalCache ||
            !Array.isArray(
                finalCache.contributors
            ) ||
            finalCache.contributors.length === 0
        ) {

            frame.innerHTML = `
                <div class="frame-loading">

                    Unable to load contributors.

                    <br><br>

                    <a
                        href="https://github.com/haproven/haproven/graphs/contributors"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View contributors on GitHub →
                    </a>

                </div>
            `;
        }
    }


    /* =====================================================
       START
    ===================================================== */

    start();


})();