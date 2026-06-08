import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import puppeteer from "puppeteer";

const host = "127.0.0.1";
const bundledChromePath = puppeteer.executablePath();
const systemChromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
    (fs.existsSync(bundledChromePath) ? bundledChromePath : systemChromePath);

await runScenario({ reportEmailMode: "", expectSent: false });
await runScenario({ reportEmailMode: "mock", expectSent: true });
await runDeepSeekResponseScenario();
await runDeepSeekToolScenario();
await runDeepSeekTimeoutScenario();
await runMissingDeepSeekKeyScenario();
await runCloudflareEmailRequestScenario();
await runCloudflareEmailTimeoutScenario();
await runRateLimitScenario();

async function runScenario({ reportEmailMode, expectSent }) {
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
                    CLOUDFLARE_API_TOKEN: "",
                    CLOUDFLARE_ACCOUNT_ID: "",
                    CLOUDFLARE_EMAIL_API_URL: "",
                    SERVICES_CHAT_MODE: "mock",
                    REPORT_EMAIL_MODE: reportEmailMode,
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );

        devServer.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stdout.write(text);
        });
        devServer.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stderr.write(text);
        });

        await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);
        await runBrowserFlow(baseUrl, { expectSent });
        console.log(`Services chat smoke test passed at ${baseUrl}`);
    } finally {
        if (devServer) {
            devServer.kill("SIGTERM");
        }
    }
}

async function runRateLimitScenario() {
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
                    SERVICES_CHAT_MODE: "mock",
                    REPORT_EMAIL_MODE: "mock",
                    SERVICES_CHAT_RATE_LIMIT: "1",
                    SERVICES_PACKAGE_RATE_LIMIT: "1",
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );

        devServer.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stdout.write(text);
        });
        devServer.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stderr.write(text);
        });

        await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);

        const chatHeaders = { "x-forwarded-for": "203.0.113.10" };
        const chatPayload = {
            language: "en",
            messages: [{ role: "user", content: "Rate limit check." }],
        };
        const firstChat = await postJson(`${baseUrl}/api/services-chat`, chatPayload, chatHeaders);
        const secondChat = await postJson(`${baseUrl}/api/services-chat`, chatPayload, chatHeaders);

        assert(firstChat.status === 200, "expected first chat request to pass");
        assert(secondChat.status === 429, "expected second chat request to be rate limited");
        assert(secondChat.body.code === "rate_limited", "expected chat rate_limited code");
        assert(Boolean(secondChat.headers.get("retry-after")), "expected chat Retry-After header");

        const packageHeaders = { "x-forwarded-for": "203.0.113.11" };
        const packagePayload = {
            visitorEmail: "visitor@example.com",
            language: "en",
            packageMarkdown: "# Test package",
            transcript: [{ role: "user", content: "Rate limit package check." }],
        };
        const firstPackage = await postJson(`${baseUrl}/api/services-package`, packagePayload, packageHeaders);
        const secondPackage = await postJson(`${baseUrl}/api/services-package`, packagePayload, packageHeaders);

        assert(firstPackage.status === 200, "expected first package request to pass");
        assert(secondPackage.status === 429, "expected second package request to be rate limited");
        assert(secondPackage.body.code === "rate_limited", "expected package rate_limited code");
        assert(Boolean(secondPackage.headers.get("retry-after")), "expected package Retry-After header");

        console.log(`Services chat rate-limit test passed at ${baseUrl}`);
    } finally {
        if (devServer) {
            devServer.kill("SIGTERM");
        }
    }
}

async function runCloudflareEmailRequestScenario() {
    const cloudflareEmail = await startFakeCloudflareEmailServer();
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
                    SERVICES_CHAT_MODE: "mock",
                    SERVICES_PACKAGE_RATE_LIMIT: "100",
                    CLOUDFLARE_API_TOKEN: "test-cloudflare-token",
                    CLOUDFLARE_ACCOUNT_ID: "test-account-id",
                    CLOUDFLARE_EMAIL_API_URL: cloudflareEmail.url,
                    REPORT_EMAIL_FROM: "me@egouda.xyz",
                    REPORT_EMAIL_TO: "me@egouda.xyz",
                    REPORT_EMAIL_MODE: "",
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );

        devServer.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stdout.write(text);
        });
        devServer.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stderr.write(text);
        });

        await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);

        const longTranscript = [
            {
                role: "assistant",
                content: "FIRST TRANSCRIPT MESSAGE MUST BE PRESERVED.",
                createdAt: "2026-01-01T00:00:00.000Z",
            },
            ...Array.from({ length: 85 }, (_, index) => ({
                role: index % 2 === 0 ? "user" : "assistant",
                content: `Transcript message ${index + 2}`,
                createdAt: `2026-01-01T00:${String((index + 1) % 60).padStart(2, "0")}:00.000Z`,
            })),
        ];
        const payload = {
            visitorEmail: "visitor@example.com",
            language: "en",
            packageMarkdown: [
                "# Agentic Pipeline POC Package",
                "",
                "## 1. Business Snapshot",
                "Support ops team needs an intake triage POC.",
                "",
                "## 2. Current Workflow",
                "Requests arrive through Slack and email.",
                "",
                "## 3. Pain And Opportunity",
                "Duplicate assignments, slow routing, and no audit trail.",
            ].join("\n"),
            transcript: longTranscript,
        };

        const first = await postJson(`${baseUrl}/api/services-package`, payload, {
            "x-forwarded-for": "203.0.113.20",
        });
        const second = await postJson(`${baseUrl}/api/services-package`, payload, {
            "x-forwarded-for": "203.0.113.20",
        });

        assert(first.status === 200, `expected first Cloudflare Email request to pass: ${JSON.stringify(first.body)}`);
        assert(second.status === 200, `expected repeat Cloudflare Email request to pass: ${JSON.stringify(second.body)}`);
        assert(first.body.delivery === "cloudflare", "expected first delivery=cloudflare");
        assert(second.body.delivery === "cloudflare", "expected repeat delivery=cloudflare");
        assert(cloudflareEmail.requests.length === 2, "expected two fake Cloudflare Email requests");

        const [firstRequest] = cloudflareEmail.requests;
        assert(firstRequest.headers.authorization === "Bearer test-cloudflare-token", "expected Cloudflare bearer token");
        assert(firstRequest.body.from?.address === "me@egouda.xyz", "expected configured from address");
        assert(firstRequest.body.from?.name === "Essam Gouda", "expected configured sender name");
        assert(firstRequest.body.to === "me@egouda.xyz", "expected configured recipient");
        assert(firstRequest.body.reply_to === "visitor@example.com", "expected visitor reply_to");
        assert(firstRequest.body.text.includes("Full Transcript"), "expected Markdown report in text body");
        assert(firstRequest.body.text.includes("FIRST TRANSCRIPT MESSAGE MUST BE PRESERVED"), "expected full transcript in Markdown report");
        assert(firstRequest.body.html.includes("Full Transcript"), "expected HTML report");
        assert(firstRequest.body.html.includes("FIRST TRANSCRIPT MESSAGE MUST BE PRESERVED"), "expected full transcript in HTML report");
        assert(firstRequest.body.attachments?.[0]?.filename === "agentic-poc-package.md", "expected Markdown attachment");
        assert(firstRequest.body.attachments?.[0]?.type === "text/markdown", "expected Markdown attachment type");
        assert(firstRequest.body.attachments?.[0]?.disposition === "attachment", "expected Markdown attachment disposition");
        assert(firstRequest.body.attachments?.[1]?.filename === "agentic-poc-report.html", "expected HTML attachment");
        assert(firstRequest.body.attachments?.[1]?.type === "text/html", "expected HTML attachment type");
        assert(firstRequest.body.attachments?.[1]?.disposition === "attachment", "expected HTML attachment disposition");

        console.log(`Services fake-Cloudflare Email request test passed at ${baseUrl}`);
    } finally {
        if (devServer) {
            devServer.kill("SIGTERM");
        }
        await cloudflareEmail.close();
    }
}

async function runCloudflareEmailTimeoutScenario() {
    const cloudflareEmail = await startDelayedJsonServer({
        delayMs: 200,
        body: { success: true, errors: [], messages: [], result: { delivered: ["me@egouda.xyz"] } },
        path: "/email/sending/send",
    });
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
                    SERVICES_CHAT_MODE: "mock",
                    SERVICES_PACKAGE_RATE_LIMIT: "100",
                    CLOUDFLARE_API_TOKEN: "test-cloudflare-token",
                    CLOUDFLARE_ACCOUNT_ID: "test-account-id",
                    CLOUDFLARE_EMAIL_API_URL: cloudflareEmail.url,
                    CLOUDFLARE_EMAIL_TIMEOUT_MS: "20",
                    REPORT_EMAIL_FROM: "me@egouda.xyz",
                    REPORT_EMAIL_TO: "me@egouda.xyz",
                    REPORT_EMAIL_MODE: "",
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );

        devServer.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stdout.write(text);
        });
        devServer.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stderr.write(text);
        });

        await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);

        const response = await postJson(`${baseUrl}/api/services-package`, {
            visitorEmail: "visitor@example.com",
            language: "en",
            packageMarkdown: "# Test package",
            transcript: [{ role: "user", content: "Cloudflare Email timeout check." }],
        }, { "x-forwarded-for": "203.0.113.21" });

        assert(response.status === 502, `expected Cloudflare Email timeout to return 502: ${JSON.stringify(response.body)}`);
        assert(response.body.delivery === "failed", "expected failed delivery for Cloudflare Email timeout");
        assert(response.body.message === "Email provider could not be reached.", "expected provider reachability message");
        assert(response.body.mailtoHref?.startsWith("mailto:"), "expected mail fallback on Cloudflare Email timeout");
        assert(response.body.markdown?.includes("Full Transcript"), "expected Markdown fallback on Cloudflare Email timeout");
        assert(response.body.html?.includes("Full Transcript"), "expected HTML fallback on Cloudflare Email timeout");

        console.log(`Services Cloudflare Email-timeout test passed at ${baseUrl}`);
    } finally {
        if (devServer) {
            devServer.kill("SIGTERM");
        }
        await cloudflareEmail.close();
    }
}

async function runDeepSeekResponseScenario() {
    const deepSeek = await startFakeDeepSeekServer();
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
                    DEEPSEEK_API_KEY: "test-deepseek-key",
                    DEEPSEEK_API_URL: deepSeek.url,
                    SERVICES_CHAT_MODE: "",
                    SERVICES_CHAT_RATE_LIMIT: "100",
                    REPORT_EMAIL_MODE: "mock",
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );

        devServer.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stdout.write(text);
        });
        devServer.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stderr.write(text);
        });

        await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);

        const incomplete = await postJson(`${baseUrl}/api/services-chat`, {
            language: "en",
            messages: [{ role: "user", content: "Force incomplete ready package." }],
        }, { "x-forwarded-for": "203.0.113.30" });

        assert(incomplete.status === 200, "expected fake DeepSeek incomplete response to pass HTTP");
        assert(incomplete.body.ready === false, "expected incomplete ready package to be rejected");
        assert(incomplete.body.packageMarkdown === null, "expected incomplete package markdown to be hidden");
        assert(
            incomplete.body.question === "Which workflow should this POC prove first?",
            `expected model repair question after incomplete ready package, got ${incomplete.body.question}`,
        );

        const complete = await postJson(`${baseUrl}/api/services-chat`, {
            language: "en",
            messages: [{ role: "user", content: "Force complete fenced package." }],
        }, { "x-forwarded-for": "203.0.113.30" });

        assert(complete.status === 200, "expected fake DeepSeek fenced response to pass HTTP");
        assert(complete.body.ready === true, "expected complete fenced package to be accepted");
        assert(
            complete.body.packageMarkdown.includes("Agentic Pipeline POC Package"),
            "expected complete package markdown",
        );
        assert(deepSeek.requests.length === 3, "expected one repair call after incomplete package plus complete call");
        assert(deepSeek.requests[0].headers.authorization === "Bearer test-deepseek-key", "expected DeepSeek bearer token");
        assert(deepSeek.requests[0].body.model === "deepseek-v4-pro", "expected current DeepSeek pro model by default");
        assert(deepSeek.requests[0].body.thinking?.type === "disabled", "expected thinking disabled");
        assert(deepSeek.requests[0].body.response_format?.type === "json_object", "expected JSON response format");

        const malformed = await postJson(`${baseUrl}/api/services-chat`, {
            language: "en",
            messages: [
                { role: "assistant", content: "What is the exact trigger that starts this workflow?" },
                { role: "user", content: "I am the CHRO + CIO. Force malformed response." },
            ],
        }, { "x-forwarded-for": "203.0.113.30" });

        assert(malformed.status === 200, "expected malformed DeepSeek response to repair through the model");
        assert(
            malformed.body.question === "Which employee workflow should we improve first?",
            `expected executive-aware repair question, got ${malformed.body.question}`,
        );
        assert(
            malformed.body.suggestedReplies.includes("Medical requests"),
            "expected model-backed suggested replies after repair",
        );

        const malformedTwice = await postJson(`${baseUrl}/api/services-chat`, {
            language: "en",
            messages: [
                { role: "assistant", content: "What is the exact trigger that starts this workflow?" },
                { role: "user", content: "Force malformed twice." },
            ],
        }, { "x-forwarded-for": "203.0.113.30" });

        assert(malformedTwice.status === 502, "expected repeated malformed model output to fail closed");
        assert(
            malformedTwice.body.code === "invalid_model_response",
            "expected controlled invalid model response code",
        );

        console.log(`Services fake-DeepSeek response test passed at ${baseUrl}`);
    } finally {
        if (devServer) {
            devServer.kill("SIGTERM");
        }
        await deepSeek.close();
    }
}

async function runDeepSeekToolScenario() {
    const deepSeek = await startFakeToolCallingDeepSeekServer();
    const browserRun = await startFakeCloudflareBrowserMarkdownServer();
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
                    DEEPSEEK_API_KEY: "test-deepseek-key",
                    DEEPSEEK_API_URL: deepSeek.url,
                    SERVICES_CHAT_MODE: "",
                    SERVICES_CHAT_RATE_LIMIT: "100",
                    REPORT_EMAIL_MODE: "mock",
                    CLOUDFLARE_API_TOKEN: "test-cloudflare-token",
                    CLOUDFLARE_ACCOUNT_ID: "test-account-id",
                    CLOUDFLARE_BROWSER_MARKDOWN_API_URL: browserRun.url,
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );

        devServer.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stdout.write(text);
        });
        devServer.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stderr.write(text);
        });

        await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);

        const response = await postJson(`${baseUrl}/api/services-chat`, {
            language: "en",
            messages: [{ role: "user", content: "I work at SUMED Pipeline in Egypt. Help me shape the pipeline workflow POC." }],
        }, { "x-forwarded-for": "203.0.113.32" });

        assert(response.status === 200, `expected tool-backed DeepSeek response to pass: ${JSON.stringify(response.body)}`);
        assert(response.body.ready === false, "expected tool-backed draft to stay not ready");
        assert(response.body.draftPackageMarkdown?.includes("SUMED public context"), "expected draft to include tool-grounded context");
        assert(response.body.usedTools?.includes("fetch_web_page"), "expected fetch_web_page to be reported");
        assert(deepSeek.requests.length === 2, "expected DeepSeek to be called before and after tool execution");
        assert(deepSeek.requests[0].body.tools?.some((tool) => tool.function?.name === "fetch_web_page"), "expected fetch_web_page tool definition");
        assert(deepSeek.requests[1].body.messages?.some((message) => message.role === "tool" && message.content.includes("SUMED public context")), "expected tool result in second DeepSeek call");
        assert(browserRun.requests.length === 1, "expected one Cloudflare Browser Run request");
        assert(browserRun.requests[0].headers.authorization === "Bearer test-cloudflare-token", "expected Cloudflare Browser Run bearer token");
        assert(browserRun.requests[0].body.url === "https://example.com/sumed", "expected public URL fetch");

        console.log(`Services DeepSeek tool-call test passed at ${baseUrl}`);
    } finally {
        if (devServer) {
            devServer.kill("SIGTERM");
        }
        await deepSeek.close();
        await browserRun.close();
    }
}

async function runDeepSeekTimeoutScenario() {
    const deepSeek = await startDelayedJsonServer({ delayMs: 200, body: { choices: [] }, path: "/chat/completions" });
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
                    DEEPSEEK_API_KEY: "test-deepseek-key",
                    DEEPSEEK_API_URL: deepSeek.url,
                    DEEPSEEK_TIMEOUT_MS: "20",
                    SERVICES_CHAT_MODE: "",
                    SERVICES_CHAT_RATE_LIMIT: "100",
                    REPORT_EMAIL_MODE: "mock",
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );

        devServer.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stdout.write(text);
        });
        devServer.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stderr.write(text);
        });

        await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);

        const response = await postJson(`${baseUrl}/api/services-chat`, {
            language: "en",
            messages: [{ role: "user", content: "DeepSeek timeout check." }],
        }, { "x-forwarded-for": "203.0.113.31" });

        assert(response.status === 502, `expected DeepSeek timeout to return 502: ${JSON.stringify(response.body)}`);
        assert(response.body.code === "deepseek_unavailable", "expected deepseek_unavailable code");
        assert(response.body.message === "DeepSeek request failed.", "expected DeepSeek failure message");

        console.log(`Services DeepSeek-timeout test passed at ${baseUrl}`);
    } finally {
        if (devServer) {
            devServer.kill("SIGTERM");
        }
        await deepSeek.close();
    }
}

async function runMissingDeepSeekKeyScenario() {
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
                    DEEPSEEK_API_KEY: "",
                    SERVICES_CHAT_MODE: "",
                    SERVICES_CHAT_RATE_LIMIT: "100",
                    REPORT_EMAIL_MODE: "mock",
                },
                stdio: ["ignore", "pipe", "pipe"],
            },
        );

        devServer.stdout.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stdout.write(text);
        });
        devServer.stderr.on("data", (chunk) => {
            const text = chunk.toString();
            if (process.env.VERBOSE_SERVICES_CHAT_TEST) process.stderr.write(text);
        });

        await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);

        const response = await postJson(`${baseUrl}/api/services-chat`, {
            language: "en",
            messages: [{ role: "user", content: "This must not silently mock." }],
        }, { "x-forwarded-for": "203.0.113.33" });

        assert(response.status === 200, "expected missing-key response to pass HTTP");
        assert(response.body.code === "missing_deepseek_key", "expected explicit missing_deepseek_key response");
        assert(response.body.configured === false, "expected configured=false");
        assert(!response.body.assistantMessage, "expected no mock assistant message without DeepSeek key");

        console.log(`Services missing-DeepSeek-key test passed at ${baseUrl}`);
    } finally {
        if (devServer) {
            devServer.kill("SIGTERM");
        }
    }
}

async function runBrowserFlow(url, { expectSent }) {
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        protocolTimeout: 60_000,
        pipe: true,
        args: ["--no-sandbox", "--disable-gpu"],
    });

    try {
        const page = await browser.newPage();
        const errors = [];
        const failedRequests = [];
        let packageRequestPayload;

        page.on("pageerror", (error) => errors.push(error.stack || error.message));
        page.on("console", (message) => {
            if (message.type() === "error") errors.push(message.text());
        });
        page.on("requestfailed", (request) => {
            failedRequests.push({
                url: request.url(),
                failure: request.failure()?.errorText,
            });
        });
        page.on("request", (request) => {
            if (!request.url().includes("/api/services-package")) return;

            try {
                packageRequestPayload = JSON.parse(request.postData() || "{}");
            } catch {
                packageRequestPayload = {};
            }
        });

        await page.setViewport({ width: 1280, height: 900 });
        await page.goto(`${url}/?lang=ar&theme=dark`, {
            waitUntil: "networkidle2",
            timeout: 30_000,
        });
        await page.waitForSelector("h1", { timeout: 10_000 });
        const redirected = await page.evaluate(() => ({
            href: location.href,
            heading: document.querySelector("h1")?.textContent?.trim() || "",
            direction: document.querySelector("main section")?.getAttribute("dir"),
        }));
        assert(
            redirected.href === `${url}/services?lang=ar&theme=dark`,
            `expected homepage redirect to preserve query params, got ${redirected.href}`,
        );
        assert(redirected.heading.includes("AI"), "expected Arabic services heading after homepage redirect");
        assert(redirected.direction === "rtl", "expected RTL services layout after homepage redirect");

        await page.goto(`${url}/services?lang=en&theme=dark`, {
            waitUntil: "networkidle2",
            timeout: 30_000,
        });
        await page.waitForSelector("#services-chat-input", { timeout: 10_000 });
        await page.evaluate(() => localStorage.removeItem("egouda-services-chat-v1"));
        await page.reload({ waitUntil: "networkidle2", timeout: 30_000 });
        await page.waitForSelector("#services-chat-input", { timeout: 10_000 });
        const initialChatState = await page.evaluate(() => ({
            logLive: document.querySelector("[role=\"log\"]")?.getAttribute("aria-live"),
            logLabelledBy: document.querySelector("[role=\"log\"]")?.getAttribute("aria-labelledby"),
            hasStarterReply: [...document.querySelectorAll("button")]
                .some((button) => button.textContent?.includes("Ops handoff")),
        }));
        assert(initialChatState.logLive === "polite", "expected chat transcript to be a polite live log");
        assert(initialChatState.logLabelledBy === "chat-heading", "expected chat log to be labelled by chat heading");
        assert(initialChatState.hasStarterReply, "expected starter quick replies");

        await sendChatMessage(
            page,
            "Customer requests enter through Slack and email, and duplicates get assigned to two people.",
        );
        await page.waitForFunction(
            () => document.body.innerText.includes("decision ownership") ||
                document.body.innerText.includes("When a request arrives"),
            { timeout: 10_000 },
        );

        await sendChatMessage(
            page,
            "The support lead decides the next step, but engineering approves account changes. Success means dedupe and owner routing with audit notes.",
        );
        await page.waitForFunction(
            () => document.body.innerText.includes("6/6"),
            { timeout: 10_000 },
        );

        await page.evaluate(() => {
            window.__originalServicesFetch = window.fetch.bind(window);
            window.__releaseServicesChatFetch = null;
            window.fetch = (input, init) => {
                const url = typeof input === "string" ? input : input.url;
                if (!url.includes("/api/services-chat")) {
                    return window.__originalServicesFetch(input, init);
                }

                return new Promise((resolve, reject) => {
                    window.__releaseServicesChatFetch = () => {
                        window.__originalServicesFetch(input, init).then(resolve, reject);
                    };
                });
            };
        });
        await page.click("#services-chat-input");
        await page.type(
            "#services-chat-input",
            "One more constraint: managers need approval before any customer-visible response.",
        );
        await page.click("button[type=\"submit\"]");
        await page.waitForFunction(
            () => document.body.innerText.includes("Thinking"),
            { timeout: 10_000 },
        );

        const staleState = await page.evaluate(() => ({
            hasPackage: JSON.parse(localStorage.getItem("egouda-services-chat-v1") || "{}").package?.ready === true,
            packageSubmitDisabled: document.querySelector("section aside button[type=\"submit\"]")?.disabled === true,
        }));
        assert(staleState.hasPackage, "expected draft package to stay visible while a new answer is pending");
        assert(staleState.packageSubmitDisabled, "expected package submit to stay disabled while chat is sending");

        await Promise.all([
            page.waitForResponse((response) => response.url().includes("/api/services-chat"), {
                timeout: 10_000,
            }),
            page.evaluate(() => window.__releaseServicesChatFetch?.()),
        ]);
        await page.waitForFunction(
            () => document.body.innerText.includes("6/6"),
            { timeout: 10_000 },
        );

        await page.type("#visitor-email", "visitor@example.com");
        const localStorageSourceMarker = "LocalStorage source marker for email verification.";
        await page.evaluate((marker) => {
            const stored = JSON.parse(localStorage.getItem("egouda-services-chat-v1") || "{}");
            stored.messages = (stored.messages || []).map((message, index) =>
                index === 0 ? { ...message, content: marker } : message
            );
            localStorage.setItem("egouda-services-chat-v1", JSON.stringify(stored));
        }, localStorageSourceMarker);

        const [, packageResponse] = await Promise.all([
            page.click("section aside button[type=\"submit\"]"),
            page.waitForResponse((response) => response.url().includes("/api/services-package"), {
                timeout: 10_000,
            }),
        ]);
        const packageResponseBody = await packageResponse.json();
        await page.waitForFunction(
            () => {
                const text = document.body.innerText.toLowerCase();
                return text.includes("package is ready locally") || text.includes("package was sent");
            },
            { timeout: 10_000 },
        );

        const result = await page.evaluate(() => {
            const stored = JSON.parse(localStorage.getItem("egouda-services-chat-v1") || "{}");
            return {
                href: location.href,
                storedMessages: stored.messages?.length ?? 0,
                storedPackageReady: stored.package?.ready === true,
                storedVisitorEmail: stored.visitorEmail,
                hasPackage: document.body.innerText.includes("Signals collected"),
                hasFallback: document.body.innerText.toLowerCase().includes("package is ready locally"),
                hasSent: document.body.innerText.toLowerCase().includes("package was sent"),
                hasMailDraft: document.body.innerText.includes("Open mail draft"),
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            };
        });

        assert(result.storedMessages >= 5, "expected full transcript in localStorage");
        assert(result.storedPackageReady, "expected ready package in localStorage");
        assert(result.storedVisitorEmail === "visitor@example.com", "expected visitor email in localStorage");
        assert(
            packageRequestPayload?.transcript?.some((message) =>
                message.content === localStorageSourceMarker
            ),
            "expected package request to use localStorage as the transcript source",
        );
        assert(
            packageResponseBody.markdown?.includes(localStorageSourceMarker),
            "expected generated Markdown report to include the localStorage transcript",
        );
        assert(
            packageResponseBody.html?.includes(localStorageSourceMarker),
            "expected generated HTML report to include the localStorage transcript",
        );
        assert(result.hasPackage, "expected package to render");
        if (expectSent) {
            assert(result.hasSent, "expected sent delivery message");
            assert(!result.hasMailDraft, "expected no fallback mail draft after successful send");
        } else {
            assert(result.hasFallback, "expected fallback delivery message without email provider config");
            assert(result.hasMailDraft, "expected mail draft link");
        }
        assert(result.scrollWidth === result.clientWidth, "expected no horizontal page overflow");
        assert(errors.length === 0, `browser errors: ${JSON.stringify(errors)}`);
        assert(failedRequests.length === 0, `failed requests: ${JSON.stringify(failedRequests)}`);
    } finally {
        await browser.close();
    }
}

async function sendChatMessage(page, message) {
    await page.click("#services-chat-input");
    await page.type("#services-chat-input", message);
    await Promise.all([
        page.keyboard.press("Enter"),
        page.waitForResponse((response) => response.url().includes("/api/services-chat"), {
            timeout: 10_000,
        }),
    ]);
}

async function postJson(url, payload, headers = {}) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify(payload),
    });

    return {
        status: response.status,
        headers: response.headers,
        body: await response.json(),
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

async function startFakeCloudflareEmailServer() {
    const requests = [];
    const port = await getAvailablePort();

    const server = http.createServer((request, response) => {
        let body = "";
        request.on("data", (chunk) => {
            body += chunk;
        });
        request.on("end", () => {
            requests.push({
                headers: request.headers,
                body: body ? JSON.parse(body) : {},
            });

            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify({
                success: true,
                errors: [],
                messages: [],
                result: {
                    delivered: ["me@egouda.xyz"],
                    permanent_bounces: [],
                    queued: [],
                },
            }));
        });
    });

    await new Promise((resolve, reject) => {
        server.on("error", reject);
        server.listen(port, host, resolve);
    });

    return {
        url: `http://${host}:${port}/email/sending/send`,
        requests,
        close: () => new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        }),
    };
}

async function startFakeDeepSeekServer() {
    const requests = [];
    const port = await getAvailablePort();

    const server = http.createServer((request, response) => {
        let body = "";
        request.on("data", (chunk) => {
            body += chunk;
        });
        request.on("end", () => {
            const parsedBody = body ? JSON.parse(body) : {};
            requests.push({
                headers: request.headers,
                body: parsedBody,
            });

            const latestUserMessage = parsedBody.messages
                ?.filter((message) => message.role === "user")
                ?.at(-1)
                ?.content || "";
            const fullPrompt = parsedBody.messages
                ?.map((message) => message.content || "")
                ?.join("\n") || "";
            const userPrompt = parsedBody.messages
                ?.filter((message) => message.role === "user")
                ?.map((message) => message.content || "")
                ?.join("\n") || "";
            const isRepairRequest = latestUserMessage.includes("previous response failed");

            if (isRepairRequest && fullPrompt.includes("malformed twice")) {
                response.writeHead(200, { "content-type": "application/json" });
                response.end(JSON.stringify({
                    choices: [{ message: { content: "this is not json" } }],
                }));
                return;
            }

            if (!isRepairRequest && latestUserMessage.includes("malformed")) {
                response.writeHead(200, { "content-type": "application/json" });
                response.end(JSON.stringify({
                    choices: [{ message: { content: "this is not json" } }],
                }));
                return;
            }

            const payload = isRepairRequest
                ? buildRepairModelPayload(userPrompt)
                : latestUserMessage.includes("complete fenced")
                ? buildCompleteModelPayload()
                : {
                    assistantMessage: "I have enough signal to package a first POC.",
                    learned: "The package is too thin to send.",
                    question: "What should the first POC prove?",
                    suggestedReplies: ["Faster triage", "Better owner routing", "Audit notes"],
                    ready: true,
                    packageTitle: "Incomplete package",
                    packageMarkdown: "# Agentic Pipeline POC Package\n\nToo thin.",
                    packageHtml: null,
                };

            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify({
                choices: [
                    {
                        message: {
                            content: latestUserMessage.includes("complete fenced")
                                ? `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``
                                : JSON.stringify(payload),
                        },
                    },
                ],
            }));
        });
    });

    await new Promise((resolve, reject) => {
        server.on("error", reject);
        server.listen(port, host, resolve);
    });

    return {
        url: `http://${host}:${port}/chat/completions`,
        requests,
        close: () => new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        }),
    };
}

async function startFakeToolCallingDeepSeekServer() {
    const requests = [];
    const port = await getAvailablePort();

    const server = http.createServer((request, response) => {
        let body = "";
        request.on("data", (chunk) => {
            body += chunk;
        });
        request.on("end", () => {
            const parsedBody = body ? JSON.parse(body) : {};
            requests.push({
                headers: request.headers,
                body: parsedBody,
            });

            const hasToolResult = parsedBody.messages?.some((message) => message.role === "tool");
            const message = hasToolResult
                ? {
                    content: JSON.stringify({
                        assistantMessage:
                            "I found public context, but I still need the internal decision point. In this workflow, who decides the next operational action?",
                        learned: "SUMED is a high-stakes pipeline operation.",
                        question: "Who decides the next operational action?",
                        suggestedReplies: ["Control room lead", "Maintenance planner", "Operations manager"],
                        ready: false,
                        packageTitle: "SUMED Pipeline POC Draft",
                        draftPackageMarkdown: buildToolDraftPackage(),
                        packageMarkdown: null,
                        packageHtml: null,
                    }),
                }
                : {
                    content: "",
                    tool_calls: [
                        {
                            id: "call_fetch_summed",
                            type: "function",
                            function: {
                                name: "fetch_web_page",
                                arguments: JSON.stringify({
                                    url: "https://example.com/sumed",
                                    reason: "Ground the named public company before asking the next workflow question.",
                                }),
                            },
                        },
                    ],
                };

            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify({ choices: [{ message }] }));
        });
    });

    await new Promise((resolve, reject) => {
        server.on("error", reject);
        server.listen(port, host, resolve);
    });

    return {
        url: `http://${host}:${port}/chat/completions`,
        requests,
        close: () => new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        }),
    };
}

async function startFakeCloudflareBrowserMarkdownServer() {
    const requests = [];
    const port = await getAvailablePort();

    const server = http.createServer((request, response) => {
        let body = "";
        request.on("data", (chunk) => {
            body += chunk;
        });
        request.on("end", () => {
            requests.push({
                headers: request.headers,
                body: body ? JSON.parse(body) : {},
            });

            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify({
                success: true,
                result: "# SUMED public context\n\nPublic page content for a pipeline company in Egypt.",
            }));
        });
    });

    await new Promise((resolve, reject) => {
        server.on("error", reject);
        server.listen(port, host, resolve);
    });

    return {
        url: `http://${host}:${port}/browser-rendering/markdown`,
        requests,
        close: () => new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        }),
    };
}

async function startDelayedJsonServer({ delayMs, body, path }) {
    const port = await getAvailablePort();

    const server = http.createServer((_request, response) => {
        setTimeout(() => {
            if (response.destroyed) return;

            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify(body));
        }, delayMs);
    });

    await new Promise((resolve, reject) => {
        server.on("error", reject);
        server.listen(port, host, resolve);
    });

    return {
        url: `http://${host}:${port}${path}`,
        close: () => new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        }),
    };
}

function buildRepairModelPayload(fullPrompt) {
    const isExecutiveContext = /\b(CHRO|CIO)\b/i.test(fullPrompt);
    return {
        assistantMessage: isExecutiveContext
            ? "Your role spans people and systems; pick the workflow with the most drag."
            : "The package is not ready yet; pick the workflow this POC should prove first.",
        learned: isExecutiveContext
            ? "Executive owner spans people process and systems."
            : "Package state was corrected to keep interviewing.",
        question: isExecutiveContext
            ? "Which employee workflow should we improve first?"
            : "Which workflow should this POC prove first?",
        suggestedReplies: isExecutiveContext
            ? ["Medical requests", "Approval routing", "Reimbursement tracking"]
            : ["Request intake", "Owner routing", "Audit notes"],
        ready: false,
        packageTitle: null,
        draftPackageMarkdown: [
            "# Agentic Pipeline POC Package",
            "",
            "## 1. Business Snapshot",
            isExecutiveContext
                ? "Visitor appears to own both people process and technology context. Exact target workflow is TBD."
                : "Visitor is still choosing the workflow the POC should prove first.",
            "",
            "## 2. Current Workflow",
            "TBD. Need the concrete trigger, first action, owner, systems, and output.",
            "",
            "## 3. Pain And Opportunity",
            "TBD. Need the delay, rework, missing owner, risk, or audit pain.",
            "",
            "## 4. Tools, Data, And Access",
            "TBD. Need systems, documents, approvals, permissions, and constraints.",
            "",
            "## 5. Human Review Boundaries",
            "TBD. Need what can be automated and what stays human-approved.",
            "",
            "## 6. Candidate Agentic Pipelines",
            "| Pipeline | Trigger | Inputs | Agent Actions | Human Review | Output | Risk | Expected Value | Complexity |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
            "| TBD workflow | TBD | TBD | Clarify, route, draft, and log | TBD | POC brief | Thin context | Faster design | Low |",
            "",
            "## 7. Recommended Free Design POC",
            "TBD until the target workflow is selected.",
            "",
            "## 8. Build Path If The POC Looks Right",
            "TBD.",
            "",
            "## 9. Questions For Essam",
            "- Which workflow should be improved first?",
        ].join("\n"),
        packageMarkdown: null,
        packageHtml: null,
    };
}

function buildCompleteModelPayload() {
    return {
        assistantMessage: "I have enough signal to package a first POC. Leave your email so Essam can follow up.",
        learned: "The first POC is intake triage with audit notes.",
        question: "Leave your email so Essam can follow up?",
        suggestedReplies: [],
        ready: true,
        packageTitle: "Agentic Pipeline POC Package",
        packageMarkdown: [
            "# Agentic Pipeline POC Package",
            "",
            "## 1. Business Snapshot",
            "Support ops team needs an intake triage POC.",
            "",
            "## 2. Current Workflow",
            "Requests arrive through Slack and email.",
            "",
            "## 3. Pain And Opportunity",
            "Duplicate assignments, unclear owner choice, slow routing, and missing audit trail.",
            "",
            "## 4. Tools, Data, And Access",
            "Slack, email, ticket history, ownership rules, and escalation policy.",
            "",
            "## 5. Human Review Boundaries",
            "The agent can recommend owner/status and draft notes. Humans approve customer-impacting actions.",
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
        packageHtml: null,
    };
}

function buildToolDraftPackage() {
    return [
        "# Agentic Pipeline POC Package",
        "",
        "## 1. Business Snapshot",
        "SUMED public context confirms the visitor named a pipeline-related organization in Egypt. Internal team, owner, volume, and business value are still TBD.",
        "",
        "## 2. Current Workflow",
        "TBD. Need the exact operational request, trigger, decision owner, and handoff path.",
        "",
        "## 3. Pain And Opportunity",
        "Likely opportunities: decision support, auditable routing, document retrieval, exception handling, and human approval around operational actions.",
        "",
        "## 4. Tools, Data, And Access",
        "TBD. Need public docs, internal SOPs, request channels, asset data, maintenance/operations systems, and approval rules.",
        "",
        "## 5. Human Review Boundaries",
        "TBD. Operationally sensitive actions should stay human-approved until proven safe.",
        "",
        "## 6. Candidate Agentic Pipelines",
        "| Pipeline | Trigger | Inputs | Agent Actions | Human Review | Output | Risk | Expected Value | Complexity |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        "| Operations intake | New operational request | Request + SOPs | Classify, retrieve SOPs, suggest next owner | Required | Decision brief | Operational mistake | Faster triage | Medium |",
        "",
        "## 7. Recommended Free Design POC",
        "Design an offline intake assistant around one high-volume operational request type.",
        "",
        "## 8. Build Path If The POC Looks Right",
        "Connect approved data sources, add approval gates, and evaluate recommendations against historical decisions.",
        "",
        "## 9. Questions For Essam",
        "- Which operational request type should the first POC focus on?",
        "- Who owns the final next-action decision?",
        "",
        "## Sources",
        "- https://example.com/sumed",
    ].join("\n");
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
