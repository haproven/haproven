
import fs from "node:fs/promises";

const ORG = "haproven";
const API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN;

const OUTPUT = "data/contributors.json";

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

async function request(path) {
    const response = await fetch(`${API}${path}`, {
        headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            ...(TOKEN ? {
                Authorization: `Bearer ${TOKEN}`
            } : {})
        },
        signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
        throw new Error(
            `${response.status} ${path}`
        );
    }

    return response.json();
}

async function paginate(path) {
    const all = [];

    for (let page = 1; ; page++) {
        const separator = path.includes("?") ? "&" : "?";

        const batch = await request(
            `${path}${separator}per_page=100&page=${page}`
        );

        if (!Array.isArray(batch)) {
            throw new Error(`Invalid response: ${path}`);
        }

        all.push(...batch);

        if (batch.length < 100) break;
    }

    return all;
}

async function main() {
    console.log(`Scanning ${ORG} repositories...`);

    const repos = await paginate(
        `/orgs/${ORG}/repos?type=public`
    );

    console.log(`Found ${repos.length} repositories`);

    const users = new Map();
    const errors = [];

    let checked = 0;

    for (const repo of repos) {
        if (repo.disabled || repo.archived) continue;

        try {
            const contributors = await paginate(
                `/repos/${ORG}/${encodeURIComponent(repo.name)}/contributors`
            );

            for (const person of contributors) {
                if (!person.login || isBot(person)) continue;

                const key = person.login.toLowerCase();

                if (!users.has(key)) {
                    users.set(key, {
                        login: person.login,
                        name: person.login,
                        bio: "",
                        avatar_url: person.avatar_url,
                        html_url: person.html_url,
                        contributions: 0,
                        repoCount: 0,
                        repositories: []
                    });
                }

                const user = users.get(key);

                const count = Number(
                    person.contributions || 0
                );

                user.contributions += count;
                user.repoCount++;

                user.repositories.push({
                    name: repo.name,
                    url: repo.html_url,
                    contributions: count
                });
            }

            checked++;

            console.log(
                `✓ ${repo.name}: ${contributors.length} contributors`
            );

        } catch (error) {
            // Empty repositories can return 409.
            if (error.message.startsWith("409 ")) {
                checked++;
                continue;
            }

            errors.push(`${repo.name}: ${error.message}`);
            console.error(`✗ ${repo.name}: ${error.message}`);
        }
    }

    if (errors.length) {
        throw new Error(
            `Incomplete scan. JSON not updated:\n${errors.join("\n")}`
        );
    }

    const members = [...users.values()]
        .sort((a, b) =>
            b.contributions - a.contributions ||
            a.login.localeCompare(b.login)
        );

    // Fetch public profile details for every contributor.
    // Requests are sequential to avoid excessive concurrency.
    for (const member of members) {
        try {
            const profile = await request(
                `/users/${encodeURIComponent(member.login)}`
            );

            member.name = profile.name || member.login;
            member.bio = profile.bio || "";
            member.avatar_url =
                profile.avatar_url || member.avatar_url;

        } catch (error) {
            console.warn(
                `Profile details unavailable: ${member.login}`
            );
        }
    }

    members.forEach((member, index) => {
        member.rank = index + 1;

        member.repositories.sort(
            (a, b) => b.contributions - a.contributions
        );
    });

    const data = {
        organization: ORG,
        generatedAt: new Date().toISOString(),
        totalRepositories: checked,
        totalMembers: members.length,
        totalContributions: members.reduce(
            (sum, m) => sum + m.contributions,
            0
        ),
        topContributors: members.slice(0, 3),
        members
    };

    await fs.mkdir("data", { recursive: true });

    await fs.writeFile(
        OUTPUT,
        JSON.stringify(data, null, 2) + "\n"
    );

    console.log(
        `Saved ${members.length} contributors to ${OUTPUT}`
    );
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});


