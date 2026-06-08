import { spawn } from "node:child_process";
import net from "node:net";

const host = "127.0.0.1";
const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
    console.error("DEEPSEEK_API_KEY is required. This live verifier calls DeepSeek but keeps email delivery mocked.");
    process.exit(1);
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
                DEEPSEEK_API_KEY: apiKey,
                SERVICES_CHAT_MODE: "",
                REPORT_EMAIL_MODE: "mock",
                SERVICES_CHAT_RATE_LIMIT: "100",
                SERVICES_PACKAGE_RATE_LIMIT: "100",
            },
            stdio: ["ignore", "pipe", "pipe"],
        },
    );

    devServer.stdout.on("data", (chunk) => {
        if (process.env.VERBOSE_SERVICES_LIVE_TEST) process.stdout.write(chunk.toString());
    });
    devServer.stderr.on("data", (chunk) => {
        if (process.env.VERBOSE_SERVICES_LIVE_TEST) process.stderr.write(chunk.toString());
    });

    await waitForServer(`${baseUrl}/services?lang=en&theme=dark`);
    const result = await runLiveConversation(baseUrl);
    await sendMockEmailPackage(baseUrl, result);
    console.log(`Services live DeepSeek verifier passed at ${baseUrl}`);
} finally {
    if (devServer) devServer.kill("SIGTERM");
}

async function runLiveConversation(baseUrl) {
    const messages = [];
    const prompts = [
        [
            "I run a B2B support ops team for a SaaS company.",
            "The workflow starts when customers send requests through Slack, email, or Zendesk.",
            "A support lead manually deduplicates requests, decides owner, drafts a reply, and escalates account changes to engineering.",
            "Pain: duplicate assignments, inconsistent owner choice, slow handoffs, no audit trail, and managers cannot see blocked work.",
            "Tools/data: Slack, Gmail, Zendesk, Notion runbooks, product docs, customer tier, ticket history, ownership rules, and escalation policy.",
            "Boundaries: the agent may classify, deduplicate, search docs, draft replies, recommend owner/status, and write handoff notes.",
            "Human approval is required before customer-impacting replies, account changes, refunds, or escalations.",
            "Success criteria: reduce triage time by 50%, catch duplicates, produce auditable routing notes, and keep humans in approval loops.",
            "A useful POC would read sample tickets, cluster duplicates, recommend owner/status, cite the rule/doc it used, and output a handoff note.",
        ].join(" "),
        [
            "To resolve any remaining ambiguity: the support lead is accountable for final triage, engineering only approves technical account changes, and the source of truth for ownership is the Notion runbook plus Zendesk historical assignments.",
            "Expected volume is 80-120 requests per day. The first POC can run offline against exported sample tickets before touching production tools.",
            "If this is enough, package the POC brief and ask for my email.",
        ].join(" "),
        [
            "There are no more constraints to add. Please create the agentic POC package now, including business snapshot, current workflow, pain, data/access, human review boundaries, candidate pipelines, recommended first POC, build path, and questions for Essam.",
        ].join(" "),
    ];

    for (const prompt of prompts) {
        messages.push({ role: "user", content: prompt });
        const response = await postJson(`${baseUrl}/api/services-chat`, {
            language: "en",
            messages,
        });

        assert(response.status === 200, `DeepSeek chat request failed: ${JSON.stringify(response.body)}`);
        assert(typeof response.body.assistantMessage === "string", "expected assistantMessage from DeepSeek route");
        assert(response.body.code !== "missing_deepseek_key", "expected live DeepSeek call, got missing key response");

        messages.push({ role: "assistant", content: response.body.assistantMessage });

        if (response.body.ready === true) {
            assert(
                typeof response.body.packageMarkdown === "string" &&
                    response.body.packageMarkdown.includes("Agentic Pipeline POC Package"),
                "expected ready DeepSeek package markdown",
            );

            return {
                messages,
                packageMarkdown: response.body.packageMarkdown,
                packageHtml: response.body.packageHtml,
            };
        }
    }

    throw new Error("DeepSeek responded, but did not produce a ready package within the live verifier prompts.");
}

async function sendMockEmailPackage(baseUrl, result) {
    const response = await postJson(`${baseUrl}/api/services-package`, {
        language: "en",
        visitorEmail: "live-test@example.com",
        transcript: result.messages,
        packageMarkdown: result.packageMarkdown,
        packageHtml: result.packageHtml,
    });

    assert(response.status === 200, `package request failed: ${JSON.stringify(response.body)}`);
    assert(response.body.sent === true, "expected mocked package email to be marked sent");
    assert(response.body.delivery === "mock", "expected mocked package email delivery");
    assert(typeof response.body.markdown === "string" && response.body.markdown.includes("Full Transcript"), "expected Markdown report with transcript");
    assert(typeof response.body.html === "string" && response.body.html.includes("Full Transcript"), "expected HTML report with transcript");
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
