import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import {
    checkRateLimit,
    clientRateLimitKey,
    readRateLimitNumber,
} from "$lib/server/rate-limit";
import {
    fetchWithTimeout,
    providerErrorMessage,
    readPositiveNumber,
} from "$lib/server/provider-fetch";
import { Buffer } from "node:buffer";
import type { RequestHandler } from "./$types";

type ChatMessage = {
    role: "assistant" | "user";
    content: string;
    createdAt?: string;
};

const defaultRecipient = "me@egouda.xyz";
const defaultSender = "me@egouda.xyz";
const packageRateLimitWindowMs = 30 * 60 * 1000;
const defaultCloudflareEmailTimeoutMs = 20_000;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return json({ message: "Invalid JSON body." }, { status: 400 });
    }

    const payload = parsePayload(body);
    const maxRequests = readRateLimitNumber(env.SERVICES_PACKAGE_RATE_LIMIT, 8);
    const rateLimit = checkRateLimit({
        key: `services-package:${clientRateLimitKey(request, getClientAddress)}`,
        max: maxRequests,
        windowMs: packageRateLimitWindowMs,
    });

    if (rateLimit.limited) {
        return json(
            {
                code: "rate_limited",
                message: payload.language === "ar"
                    ? "محاولات إرسال كتير بسرعة. جرّب تاني بعد شوية."
                    : "Too many package submissions too quickly. Try again in a few minutes.",
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(rateLimit.retryAfter),
                },
            },
        );
    }

    if (!payload.visitorEmail) {
        return json({ message: "A valid reply email is required." }, { status: 400 });
    }

    if (!payload.packageMarkdown) {
        return json({ message: "Package markdown is required." }, { status: 400 });
    }

    const recipient = env.REPORT_EMAIL_TO || defaultRecipient;
    const subject = `New agentic POC package from ${payload.visitorEmail}`;
    const markdown = buildMarkdownReport(payload);
    const html = buildHtmlReport(payload);
    const mailtoHref = buildMailtoHref(recipient, subject, markdown);

    const cloudflareToken = env.CLOUDFLARE_API_TOKEN;
    const cloudflareAccountId = env.CLOUDFLARE_ACCOUNT_ID;
    const cloudflareEmailWorkerUrl = env.CLOUDFLARE_EMAIL_WORKER_URL;
    const cloudflareEmailWorkerSecret = env.CLOUDFLARE_EMAIL_WORKER_SECRET;
    const from = env.REPORT_EMAIL_FROM || defaultSender;

    if (env.REPORT_EMAIL_MODE === "mock") {
        return json({
            sent: true,
            delivery: "mock",
            mailtoHref,
            markdown,
            html,
        });
    }

    const canSendViaWorker = Boolean(cloudflareEmailWorkerUrl && cloudflareEmailWorkerSecret);
    const canSendViaRest = Boolean(cloudflareToken && (cloudflareAccountId || env.CLOUDFLARE_EMAIL_API_URL));
    if (!canSendViaWorker && !canSendViaRest) {
        return json({
            sent: false,
            delivery: "not_configured",
            message: "Cloudflare Email Service is not configured.",
            mailtoHref,
            markdown,
            html,
        });
    }

    let response: Response;
    try {
        const sendUrl = canSendViaWorker
            ? cloudflareEmailWorkerUrl
            : env.CLOUDFLARE_EMAIL_API_URL ||
                `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/email/sending/send`;
        const sendToken = canSendViaWorker ? cloudflareEmailWorkerSecret : cloudflareToken;

        response = await fetchWithTimeout(
            sendUrl!,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${sendToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: { address: from, name: "Essam Gouda" },
                    to: recipient,
                    reply_to: payload.visitorEmail,
                    subject,
                    html,
                    text: markdown,
                    attachments: [
                        {
                            filename: "agentic-poc-package.md",
                            content: toBase64(markdown),
                            type: "text/markdown",
                            disposition: "attachment",
                        },
                        {
                            filename: "agentic-poc-report.html",
                            content: toBase64(html),
                            type: "text/html",
                            disposition: "attachment",
                        },
                    ],
                }),
            },
            readPositiveNumber(env.CLOUDFLARE_EMAIL_TIMEOUT_MS, defaultCloudflareEmailTimeoutMs),
        );
    } catch (error) {
        return json(
            {
                sent: false,
                delivery: "failed",
                message: "Email provider could not be reached.",
                detail: providerErrorMessage(error, "Cloudflare Email Service"),
                mailtoHref,
                markdown,
                html,
            },
            { status: 502 },
        );
    }

    const responseDetail = await readProviderResponse(response);
    if (!response.ok) {
        return json(
            {
                sent: false,
                delivery: "failed",
                message: "Email provider rejected the package.",
                detail: responseDetail.slice(0, 1000),
                mailtoHref,
                markdown,
                html,
            },
            { status: 502 },
        );
    }

    if (responseDetail && isCloudflareFailure(responseDetail)) {
        return json(
            {
                sent: false,
                delivery: "failed",
                message: "Email provider rejected the package.",
                detail: responseDetail.slice(0, 1000),
                mailtoHref,
                markdown,
                html,
            },
            { status: 502 },
        );
    }

    return json({
        sent: true,
        delivery: "cloudflare",
        mailtoHref,
        markdown,
        html,
    });
};

function parsePayload(body: unknown) {
    const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const visitorEmail = typeof record.visitorEmail === "string" && isEmail(record.visitorEmail)
        ? record.visitorEmail.trim()
        : "";
    const packageMarkdown = typeof record.packageMarkdown === "string"
        ? record.packageMarkdown.trim().slice(0, 50000)
        : "";
    const packageHtml = typeof record.packageHtml === "string"
        ? record.packageHtml.trim().slice(0, 50000)
        : "";
    const language = record.language === "ar" ? "ar" : "en";
    const rawTranscript = Array.isArray(record.transcript) ? record.transcript : [];
    const transcript = rawTranscript
        .map((message): ChatMessage | null => {
            if (!message || typeof message !== "object") return null;
            const candidate = message as Record<string, unknown>;
            const role = candidate.role === "user" ? "user" : candidate.role === "assistant" ? "assistant" : null;
            const content = typeof candidate.content === "string"
                ? candidate.content.trim().slice(0, 6000)
                : "";
            const createdAt = typeof candidate.createdAt === "string" ? candidate.createdAt : undefined;

            if (!role || !content) return null;
            return { role, content, createdAt };
        })
        .filter((message): message is ChatMessage => Boolean(message));

    return { visitorEmail, packageMarkdown, packageHtml, language, transcript };
}

function buildMarkdownReport(payload: ReturnType<typeof parsePayload>) {
    const transcript = payload.transcript.map((message, index) => [
        `### ${index + 1}. ${message.role === "user" ? "Visitor" : "Essam intake agent"}`,
        message.createdAt ? `Time: ${message.createdAt}` : "",
        "",
        message.content,
        "",
    ].filter(Boolean).join("\n")).join("\n");

    return [
        "# New Agentic POC Package",
        "",
        `Reply email: ${payload.visitorEmail}`,
        `Language: ${payload.language}`,
        `Generated: ${new Date().toISOString()}`,
        "",
        "## POC Package",
        "",
        payload.packageMarkdown,
        "",
        "## Full Transcript",
        "",
        transcript || "No transcript supplied.",
        "",
    ].join("\n");
}

function buildHtmlReport(payload: ReturnType<typeof parsePayload>) {
    const transcriptHtml = payload.transcript.map((message, index) => `
        <section class="message ${message.role}">
            <h3>${index + 1}. ${message.role === "user" ? "Visitor" : "Essam intake agent"}</h3>
            ${message.createdAt ? `<p class="time">${escapeHtml(message.createdAt)}</p>` : ""}
            <pre>${escapeHtml(message.content)}</pre>
        </section>
    `).join("");

    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { margin: 0; padding: 32px; background: #f7f2ea; color: #15171d; font-family: Inter, Arial, sans-serif; line-height: 1.55; }
        main { max-width: 860px; margin: 0 auto; background: #fffaf3; border: 1px solid #ded6c9; border-radius: 14px; padding: 28px; }
        h1, h2, h3 { line-height: 1.15; }
        .meta { color: #5e6573; margin-bottom: 28px; }
        pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f1ece4; border: 1px solid #ded6c9; border-radius: 10px; padding: 16px; }
        .message { border-top: 1px solid #ded6c9; padding-top: 18px; margin-top: 18px; }
        .message.user h3 { color: #4338ca; }
        .time { color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <main>
        <h1>New Agentic POC Package</h1>
        <p class="meta">
            Reply email: <strong>${escapeHtml(payload.visitorEmail)}</strong><br>
            Language: ${escapeHtml(payload.language)}<br>
            Generated: ${escapeHtml(new Date().toISOString())}
        </p>

        <h2>POC Package</h2>
        <pre>${escapeHtml(payload.packageMarkdown)}</pre>

        ${payload.packageHtml ? `<h2>Model HTML Package</h2><pre>${escapeHtml(payload.packageHtml)}</pre>` : ""}

        <h2>Full Transcript</h2>
        ${transcriptHtml || "<p>No transcript supplied.</p>"}
    </main>
</body>
</html>`;
}

function buildMailtoHref(to: string, subject: string, body: string) {
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 12000))}`;
}

function toBase64(value: string) {
    return Buffer.from(value, "utf8").toString("base64");
}

async function readProviderResponse(response: Response) {
    const text = await response.text();
    return text.trim();
}

function isCloudflareFailure(responseText: string) {
    try {
        const parsed = JSON.parse(responseText) as { success?: unknown };
        return parsed.success === false;
    } catch {
        return false;
    }
}

function isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
