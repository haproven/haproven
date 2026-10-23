
import fs from "node:fs/promises";
import path from "node:path";

/* ==========================================================
   HAPROVEN CONTRIBUTORS GENERATOR V2
   FAST • TOKEN FREE • ORGANIZATION WIDE

   Node.js 20+
   Output: data/contributors.json
========================================================== */

const CONFIG = {
    organization: "haproven",
    api: "https://api.github.com",

    output: "data/contributors.json",

    // Keep requests low without authentication.
    concurrency: 3,

    // GitHub unauthenticated API limit is generally
    // 60 requests per hour per IP.
    maxRequests: 55,

    timeout: 12000,
    retries: 2,
    retryDelay: 1200,

    // Profile details are optional.
    // Keep disabled for maximum speed and reliability.
    fetchProfiles: false,

    // Set true to include archived public repositories.
    includeArchived: true,

    // If true, existing valid JSON is preserved on errors.
    preserveOnError: true
};

const BOT_NAMES = new Set([
    "github-actions",
    "dependabot",
    "renovate",
    "codecov",
    "greenkeeper",
    "snyk-bot",
    "semantic-release-bot",
    "imgbot"
]);

let requestCount = 0;

/* ==========================================================
   HELPERS
========================================================== */

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

function isBot(user) {
    const login = String(user?.login || "").toLowerCase();

    return (
        user?.type === "Bot" ||
        login.endsWith("[bot]") ||
        login.endsWith("-bot") ||
        login.endsWith("_bot") ||
        BOT_NAMES.has(login)
    );
}

function isHuman(user) {
    return Boolean(
        user?.login &&
        !isBot(user)
    );
}

function isValidURL(value) {
    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}

function normalizeContributor(user) {
    const login = String(user.login);

    return {
        login,
        name: login,
        bio: "",
        avatar_url: isValidURL(user.avatar_url)
            ? user.avatar_url
            : `https://github.com/${encodeURIComponent(login)}.png`,

        html_url: isValidURL(user.html_url)
            ? user.html_url
            : `https://github.com/${encodeURIComponent(login)}`,

        contributions: 0,
        repoCount: 0,
        repositories: []
    };
}

/* ==========================================================
   GITHUB API
========================================================== */

async function request(endpoint) {
    const url = endpoint.startsWith("https://")
        ? endpoint
        : `${CONFIG.api}${endpoint}`;

    for (let attempt = 0; attempt <= CONFIG.retries; attempt++) {

        if (requestCount >= CONFIG.maxRequests) {
            throw new Error(
                `API request budget reached (${CONFIG.maxRequests}). ` +
                "Unauthenticated GitHub API limit may apply."
            );
        }

        requestCount++;

        let response;

        try {
            response = await fetch(url, {
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "User-Agent": "Haproven-Frame"
                },
                signal: AbortSignal.timeout(CONFIG.timeout)
            });

            if (response.status === 409) {
                return [];
            }

            if (response.ok) {
                return response.json();
            }

            if (response.status === 403 || response.status === 429) {
                const remaining = response.headers.get(
                    "x-ratelimit-remaining"
                );

                if (remaining === "0") {
                    throw new Error(
                        "GitHub API rate limit exceeded"
                    );
                }
            }

            if (
                attempt < CONFIG.retries &&
                [500, 502, 503, 504, 429].includes(response.status)
            ) {
                await sleep(
                    CONFIG.retryDelay * (attempt + 1)
                );

                continue;
            }

            throw new Error(
                `GitHub API ${response.status}: ${url}`
            );

        } catch (error) {
            if (
                attempt >= CONFIG.retries ||
                error.message.includes("rate limit") ||
                error.message.includes("API request budget")
            ) {
                throw error;
            }

            await sleep(
                CONFIG.retryDelay * (attempt + 1)
            );
        }
    }

    throw new Error(`Request failed: ${url}`);
}

/* ==========================================================
   PAGINATION
========================================================== */

async function paginate(endpoint) {
    const results = [];

    for (let page = 1; ; page++) {
        const separator = endpoint.includes("?")
            ? "&"
            : "?";

        const data = await request(
            `${endpoint}${separator}per_page=100&page=${page}`
        );

        if (!Array.isArray(data)) {
            throw new Error(
                `Invalid API response: ${endpoint}`
            );
        }

        results.push(...data);

        if (data.length < 100) {
            break;
        }
    }

    return results;
}

/* ==========================================================
   CONCURRENT REPOSITORY SCANNER
========================================================== */

async function scanRepositories(repos) {
    const results = new Array(repos.length);
    const errors = [];

    let cursor = 0;

    async function worker() {
        while (cursor < repos.length) {
            const index = cursor++;
            const repo = repos[index];

            try {
                const contributors = await paginate(
                    `/repos/${CONFIG.organization}/` +
                    `${encodeURIComponent(repo.name)}/contributors`
                );

                results[index] = {
                    repo,
                    contributors
                };

                console.log(
                    `✓ ${repo.name}: ${contributors.length} contributors`
                );

            } catch (error) {
                errors.push({
                    repository: repo.name,
                    error: error.message
                });

                console.error(
                    `✗ ${repo.name}: ${error.message}`
                );
            }
        }
    }

    const workers = Array.from(
        {
            length: Math.min(
                CONFIG.concurrency,
                repos.length
            )
        },
        () => worker()
    );

    await Promise.all(workers);

    return { results, errors };
}

/* ==========================================================
   MERGE CONTRIBUTORS
========================================================== */

function mergeContributors(results) {
    const users = new Map();

    for (const item of results) {
        if (!item) continue;

        const { repo, contributors } = item;

        for (const person of contributors) {
            if (!isHuman(person)) continue;

            const key = person.login.toLowerCase();

            if (!users.has(key)) {
                users.set(
                    key,
                    normalizeContributor(person)
                );
            }

            const user = users.get(key);

            const count = Number(
                person.contributions || 0
            );

            user.contributions += count;

            user.repositories.push({
                name: repo.name,
                url: repo.html_url,
                contributions: count
            });

            user.repoCount = user.repositories.length;
        }
    }

    return [...users.values()].sort(
        (a, b) =>
            b.contributions - a.contributions ||
            a.login.localeCompare(b.login)
    );
}

/* ==========================================================
   OPTIONAL PROFILE ENRICHMENT
========================================================== */

async function enrichProfiles(members) {
    if (!CONFIG.fetchProfiles) {
        return members;
    }

    // Leave request budget for essential repository scans.
    const available = Math.max(
        0,
        CONFIG.maxRequests - requestCount - 2
    );

    const targets = members.slice(0, available);

    for (const member of targets) {
        try {
            const profile = await request(
                `/users/${encodeURIComponent(member.login)}`
            );

            member.name = profile.name || member.login;
            member.bio = profile.bio || "";

            if (isValidURL(profile.avatar_url)) {
                member.avatar_url = profile.avatar_url;
            }

        } catch (error) {
            console.warn(
                `Profile skipped: ${member.login}`
            );

            break;
        }
    }

    return members;
}

/* ==========================================================
   MAIN GENERATOR
========================================================== */

async function main() {
    const startTime = Date.now();

    console.log("");
    console.log("=================================");
    console.log(" HAPROVEN CONTRIBUTORS GENERATOR ");
    console.log("=================================");
    console.log("");

    console.log(
        `Organization: ${CONFIG.organization}`
    );

    console.log("Fetching public repositories...");

    const allRepos = await paginate(
        `/orgs/${CONFIG.organization}/repos?type=public`
    );

    const repos = allRepos.filter(repo =>
        !repo.disabled &&
        (
            CONFIG.includeArchived ||
            !repo.archived
        )
    );

    console.log(
        `Repositories found: ${repos.length}`
    );

    if (!repos.length) {
        throw new Error(
            "No public repositories found"
        );
    }

    const { results, errors } =
        await scanRepositories(repos);

    if (errors.length) {
        throw new Error(
            `Incomplete scan: ${errors.length} repositories failed.\n` +
            errors.map(
                e => `${e.repository}: ${e.error}`
            ).join("\n")
        );
    }

    let members = mergeContributors(results);

    members = await enrichProfiles(members);

    members.forEach((member, index) => {
        member.rank = index + 1;

        member.repositories.sort(
            (a, b) =>
                b.contributions - a.contributions
        );
    });

    const totalContributions = members.reduce(
        (sum, member) =>
            sum + member.contributions,
        0
    );

    const data = {
        organization: CONFIG.organization,

        generatedAt: new Date().toISOString(),

        totalRepositories: repos.length,
        totalMembers: members.length,
        totalContributions,

        topContributors: members.slice(0, 3),

        members
    };

    await fs.mkdir(
        path.dirname(CONFIG.output),
        { recursive: true }
    );

    await fs.writeFile(
        CONFIG.output,
        JSON.stringify(data, null, 2) + "\n",
        "utf8"
    );

    const seconds = (
        (Date.now() - startTime) / 1000
    ).toFixed(2);

    console.log("");
    console.log("=================================");
    console.log(" GENERATION COMPLETED ");
    console.log("=================================");
    console.log(`Repositories: ${repos.length}`);
    console.log(`Members: ${members.length}`);
    console.log(`Contributions: ${totalContributions}`);
    console.log(`API Requests: ${requestCount}`);
    console.log(`Time: ${seconds}s`);
    console.log(`Output: ${CONFIG.output}`);
    console.log("=================================");
}

main().catch(error => {
    console.error("");
    console.error("Generation failed:", error.message);

    if (CONFIG.preserveOnError) {
        console.error(
            "Existing contributors.json was not overwritten."
        );
    }

    process.exitCode = 1;
});
