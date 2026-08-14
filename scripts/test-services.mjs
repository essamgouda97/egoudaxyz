import { spawn } from "node:child_process";
import net from "node:net";

const host = "127.0.0.1";
const port = await getAvailablePort();
const baseUrl = `http://${host}:${port}`;
const paidBookingUrl = "https://cal.com/mock-user/ai-workflow-sprint";
let devServer;

try {
    devServer = spawn(
        "npm",
        ["run", "dev", "--", "--host", host, "--port", String(port), "--strictPort"],
        {
            env: {
                ...process.env,
                SERVICES_QUESTION_MODE: "mock",
                SERVICES_QUESTION_RATE_LIMIT: "100",
                SERVICES_PAID_BOOKING_URL: paidBookingUrl,
                SERVICES_PRICE_CENTS: "25000",
                SERVICES_CURRENCY: "cad",
            },
            stdio: ["ignore", "pipe", "pipe"],
        },
    );

    devServer.stdout.on("data", (chunk) => {
        if (process.env.VERBOSE_SERVICES_TEST) process.stdout.write(chunk);
    });
    devServer.stderr.on("data", (chunk) => {
        if (process.env.VERBOSE_SERVICES_TEST) process.stderr.write(chunk);
    });

    await waitForServer(`${baseUrl}/services?lang=en`);

    const englishPage = await fetch(`${baseUrl}/services?lang=en`);
    const englishHtml = await englishPage.text();
    assert(englishPage.status === 200, "English services page should load");
    assert(englishHtml.includes("One workflow. Built in one week."), "English offer copy is missing");
    assert(englishHtml.includes("SaaSaaS!!"), "SaaSaaS mark is missing");
    assert(englishHtml.includes("$250"), "Fixed price is missing");
    assert(englishHtml.includes(paidBookingUrl), "Paid Cal.com booking link is missing");
    assert(englishHtml.includes('data-app="budget"'), "Budget app is missing");
    assert(englishHtml.includes('data-app="home-control"'), "Home control app is missing");
    assert(englishHtml.includes('data-app="document-reader"'), "Document reader app is missing");
    assert(englishHtml.includes("No private data."), "Question privacy warning is missing");
    assert(!englishHtml.includes("synthetic"), "Synthetic-data narration should stay hidden");
    assert(!englishHtml.includes("mock network"), "Mock-network narration should stay hidden");
    assert(!englishHtml.includes("sample document"), "Sample-document narration should stay hidden");

    const arabicPage = await fetch(`${baseUrl}/services?lang=ar`);
    const arabicHtml = await arabicPage.text();
    assert(arabicPage.status === 200, "Arabic services page should load");
    assert(arabicHtml.includes("بتتبني في أسبوع"), "Arabic offer copy is missing");
    assert(arabicHtml.includes("ميزانية الشهر"), "Arabic budget copy is missing");
    assert(arabicHtml.includes("تحكم البيت"), "Arabic home copy is missing");
    assert(arabicHtml.includes("اقرأ مستند"), "Arabic document copy is missing");

    const question = await postJson(`${baseUrl}/api/services-question`, {
        question: "Can this work with my spreadsheets?",
        language: "en",
    });
    assert(question.status === 200, "Mock question should succeed");
    assert(typeof question.body.answer === "string" && question.body.answer.length > 0, "Mock answer is missing");

    const invalidQuestion = await postJson(`${baseUrl}/api/services-question`, {
        question: "x".repeat(601),
        language: "en",
    });
    assert(invalidQuestion.status === 400, "Oversized question should be rejected");

    for (const removedEndpoint of ["/api/services-chat", "/api/services-package", "/api/services-checkout"]) {
        const response = await postJson(`${baseUrl}${removedEndpoint}`, {});
        assert(response.status === 404, `${removedEndpoint} should stay removed`);
    }

    console.log(`Services verifier passed at ${baseUrl}`);
} finally {
    if (devServer) devServer.kill("SIGTERM");
}

async function postJson(url, payload) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
    const text = await response.text();
    let body = null;
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }

    return {
        status: response.status,
        body,
    };
}

async function waitForServer(url) {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch {
            // Vite is still starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Timed out waiting for ${url}`);
}

function getAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen(0, host, () => {
            const address = server.address();
            const availablePort = typeof address === "object" && address ? address.port : null;
            server.close(() => {
                if (availablePort) resolve(availablePort);
                else reject(new Error("Could not allocate a local port"));
            });
        });
    });
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}
