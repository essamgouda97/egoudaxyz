import { spawn } from "node:child_process";
import net from "node:net";

const host = "127.0.0.1";
const confirm = process.env.CONFIRM_SEND_REAL_EMAIL === "yes";
const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareEmailWorkerUrl = process.env.CLOUDFLARE_EMAIL_WORKER_URL;
const cloudflareEmailWorkerSecret = process.env.CLOUDFLARE_EMAIL_WORKER_SECRET;
const from = process.env.REPORT_EMAIL_FROM || "me@egouda.xyz";
const to = process.env.REPORT_EMAIL_TO || "me@egouda.xyz";

if (!confirm) {
    console.error("Set CONFIRM_SEND_REAL_EMAIL=yes to run this verifier. It sends one real email via Cloudflare Email Service.");
    process.exit(1);
}

if ((!cloudflareToken || !cloudflareAccountId) && (!cloudflareEmailWorkerUrl || !cloudflareEmailWorkerSecret)) {
    console.error("Configure either CLOUDFLARE_EMAIL_WORKER_URL + CLOUDFLARE_EMAIL_WORKER_SECRET or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID.");
    process.exit(1);
}

if (cloudflareToken && cloudflareAccountId) {
    await verifyCloudflareToken(cloudflareToken, cloudflareAccountId);
}

const port = await getAvailablePort();
const baseUrl = `http://${host}:${port}`;
let devServer;

try {
    devServer = spawn(
        "npm",
        ["run", "dev", "--", "--host", host, "--port", String(port), "--strictPort"],
        {
            env: {
                ...process.env,
                CLOUDFLARE_API_TOKEN: cloudflareToken,
                CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId,
                CLOUDFLARE_EMAIL_WORKER_URL: cloudflareEmailWorkerUrl,
                CLOUDFLARE_EMAIL_WORKER_SECRET: cloudflareEmailWorkerSecret,
                REPORT_EMAIL_FROM: from,
                REPORT_EMAIL_TO: to,
                REPORT_EMAIL_MODE: "",
                SERVICES_PACKAGE_RATE_LIMIT: "100",
            },
            stdio: ["ignore", "pipe", "pipe"],
        },
    );

    devServer.stdout.on("data", (chunk) => {
        if (process.env.VERBOSE_SERVICES_EMAIL_TEST) process.stdout.write(chunk.toString());
    });
    devServer.stderr.on("data", (chunk) => {
        if (process.env.VERBOSE_SERVICES_EMAIL_TEST) process.stderr.write(chunk.toString());
    });

    await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);
    await sendLiveEmailPackage(baseUrl);
    console.log(`Services live Cloudflare Email verifier sent one package to ${to} from ${from}.`);
} finally {
    if (devServer) devServer.kill("SIGTERM");
}

async function sendLiveEmailPackage(baseUrl) {
    const response = await postJson(`${baseUrl}/api/services-package`, {
        language: "en",
        visitorEmail: "live-email-test@example.com",
        transcript: [
            {
                role: "assistant",
                content: "I am Essam's intake agent. What workflow should we improve?",
                createdAt: "2026-01-01T00:00:00.000Z",
            },
            {
                role: "user",
                content: "Support requests arrive in Slack and email. We need dedupe, routing, owner recommendations, and audit notes.",
                createdAt: "2026-01-01T00:01:00.000Z",
            },
            {
                role: "assistant",
                content: "I have enough signal to package a first POC. Leave your email so Essam can follow up.",
                createdAt: "2026-01-01T00:02:00.000Z",
            },
        ],
        packageMarkdown: [
            "# Agentic Pipeline POC Package",
            "",
            "## 1. Business Snapshot",
            "Live email verification package for Essam's services intake flow.",
            "",
            "## 2. Current Workflow",
            "Support requests arrive through Slack and email and require manual triage.",
            "",
            "## 3. Pain And Opportunity",
            "Duplicate requests, inconsistent owner decisions, slow handoffs, and missing audit trail.",
            "",
            "## 4. Tools, Data, And Access",
            "Slack, email, ticket history, ownership rules, and escalation policy.",
            "",
            "## 5. Human Review Boundaries",
            "Human approval before customer-impacting replies or account changes.",
            "",
            "## 6. Candidate Agentic Pipelines",
            "| Pipeline | Trigger | Inputs | Agent Actions | Human Review | Output | Risk | Expected Value | Complexity |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
            "| Intake triage | New request | Message + history | Dedupe, classify, route | Edge cases | Handoff note | Wrong owner | Faster triage | Medium |",
            "",
            "## 7. Recommended Free Design POC",
            "Offline ticket triage POC that clusters duplicates, recommends owner/status, and writes auditable handoff notes.",
            "",
            "## 8. Build Path If The POC Looks Right",
            "Connect live channels, add approval gates, and measure routing quality.",
            "",
            "## 9. Questions For Essam",
            "- Which request categories matter most?",
            "- What source of truth owns routing?",
        ].join("\n"),
    });

    assert(response.status === 200, formatPackageFailure(response));
    assert(response.body.sent === true, `expected sent=true, got ${JSON.stringify(response.body)}`);
    assert(response.body.delivery === "cloudflare", `expected delivery=cloudflare, got ${response.body.delivery}`);
    assert(typeof response.body.markdown === "string" && response.body.markdown.includes("Full Transcript"), "expected Markdown report");
    assert(typeof response.body.html === "string" && response.body.html.includes("Full Transcript"), "expected HTML report");
}

function formatPackageFailure(response) {
    const detail = parseProviderDetail(response.body?.detail);
    return [
        `email package request failed with HTTP ${response.status}`,
        response.body?.message ? `app message: ${response.body.message}` : "",
        response.body?.delivery ? `delivery: ${response.body.delivery}` : "",
        detail ? `provider: ${detail}` : "",
    ].filter(Boolean).join("; ");
}

function parseProviderDetail(detail) {
    if (!detail || typeof detail !== "string") return "";
    try {
        const parsed = JSON.parse(detail);
        if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) {
            return parsed.errors
                .map((error) => [error.code, error.message].filter(Boolean).join(" "))
                .filter(Boolean)
                .join("; ");
        }
    } catch {
        return detail.slice(0, 500);
    }
    return "";
}

async function verifyCloudflareToken(token, accountId) {
    const verifyUrl = token.startsWith("cfat_")
        ? `https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`
        : "https://api.cloudflare.com/client/v4/user/tokens/verify";

    let response;
    try {
        response = await fetch(verifyUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (error) {
        console.error(`Cloudflare token verification could not reach the API: ${error.message}`);
        process.exit(1);
    }

    let body;
    try {
        body = await response.json();
    } catch {
        body = { errors: [{ message: await response.text() }] };
    }

    if (!response.ok || body?.success !== true) {
        const detail = Array.isArray(body?.errors)
            ? body.errors.map((error) => error.message).filter(Boolean).join("; ")
            : "";
        console.error(`Cloudflare token verification failed${detail ? `: ${detail}` : "."}`);
        process.exit(1);
    }
}

async function postJson(url, payload) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    let body;
    try {
        body = await response.json();
    } catch {
        body = { message: await response.text() };
    }

    return {
        status: response.status,
        body,
    };
}

function getAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen(0, host, () => {
            const address = server.address();
            server.close(() => {
                if (address && typeof address === "object") resolve(address.port);
                else reject(new Error("Could not allocate a test port."));
            });
        });
    });
}

async function waitForServer(url) {
    const deadline = Date.now() + 30_000;
    let lastError;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch (error) {
            lastError = error;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
    }

    throw lastError || new Error(`Timed out waiting for ${url}`);
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}
