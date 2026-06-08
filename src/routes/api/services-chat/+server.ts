import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { z } from "zod";
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
import {
    executeServiceTool,
    hasConfiguredServiceTools,
    serviceToolDefinitions,
    type DeepSeekToolCall,
} from "$lib/server/services-tools";
import type { RequestHandler } from "./$types";

type Language = "en" | "ar";
type ChatRole = "assistant" | "user";

type PublicMessage = {
    role: ChatRole;
    content: string;
};

type DeepSeekMessage =
    | {
        role: "system" | "user";
        content: string;
    }
    | {
        role: "assistant";
        content?: string | null;
        tool_calls?: DeepSeekToolCall[];
    }
    | {
        role: "tool";
        tool_call_id: string;
        content: string;
    };

const deepSeekEndpoint = "https://api.deepseek.com/chat/completions";
const maxMessages = 40;
const maxMessageLength = 5000;
const chatRateLimitWindowMs = 15 * 60 * 1000;
const defaultDeepSeekTimeoutMs = 30_000;
const maxToolRounds = 2;
const boundedTextSchema = (maxLength: number) =>
    z.string()
        .transform((value) => value.trim().slice(0, maxLength))
        .pipe(z.string().min(1));

const publicMessageSchema = z.object({
    role: z.enum(["assistant", "user"]),
    content: boundedTextSchema(maxMessageLength),
});

const requestBodySchema = z.object({
    language: z.enum(["en", "ar"]).catch("en"),
    messages: z.array(publicMessageSchema).transform((messages) => messages.slice(-maxMessages)),
});

const modelResponseSchema = z.object({
    assistantMessage: z.string().optional().default(""),
    learned: z.string().nullable().optional(),
    question: z.string().nullable().optional(),
    suggestedReplies: z.array(z.string()).optional().default([]),
    ready: z.boolean().optional().default(false),
    packageTitle: z.string().nullable().optional(),
    draftPackageMarkdown: z.string().nullable().optional(),
    packageMarkdown: z.string().nullable().optional(),
    packageHtml: z.string().nullable().optional(),
}).passthrough();

const requiredPackageSections = [
    "business snapshot",
    "current workflow",
    "pain",
    "tools",
    "human review",
    "candidate agentic",
    "recommended",
    "build path",
    "questions for essam",
];

const packageTemplate = `# Agentic Pipeline POC Package

## 1. Business Snapshot
Team/company, users served, workflow owner, frequency, urgency, and business value.

## 2. Current Workflow
Trigger, inputs, tools, steps, decisions, outputs, handoffs, exceptions, and where work waits.

## 3. Pain And Opportunity
Confirmed pain, likely hidden pain, contradictions resolved, and what the user may not be naming clearly.

## 4. Tools, Data, And Access
Systems, documents, databases, APIs, permissions, constraints, and data sensitivity notes. Never include secrets.

## 5. Human Review Boundaries
What agents can do alone, what needs approval, and what must remain human-owned.

## 6. Candidate Agentic Pipelines
Pipeline | Trigger | Inputs | Agent Actions | Human Review | Output | Risk | Expected Value | Complexity

## 7. Recommended Free Design POC
The smallest useful POC Essam should design first, what it proves, and what stays out of scope.

## 8. Build Path If The POC Looks Right
Practical next build slice if the user wants Essam to help build it.

## 9. Questions For Essam
Open questions that still need consultant judgment.`;

const systemPrompt = `You are Essam Gouda's agentic-pipeline intake agent.

Your job is to interview a visitor until you can package a practical POC brief for Essam.

Core behavior:
- Ask one question at a time.
- Match the visitor's language, tone, vocabulary, and answer style.
- Grill gently but concretely. Vague answers must become specific.
- Keep every visible response short. The visitor should be able to scan it in under 8 seconds.
- After each answer, return one short signal you learned, then one highest-leverage question.
- Track facts across the whole conversation. If answers conflict, slow down, explain the mismatch neutrally, propose the cleanest interpretation, and ask the visitor to confirm or correct it.
- If the visitor gives only their title or role, treat it as ownership context, not as the workflow. Ask which workflow under that role is painful.
- For executive titles like CHRO, CIO, COO, CFO, CTO, or CEO, connect the title to likely workflow areas, then ask them to pick the target workflow. Do not ask what happens after their title.
- If the visitor cannot name the pain clearly, infer likely pain points from the workflow and offer two or three hypotheses.
- Make the value of an agentic pipeline tangible: automation, retrieval, tool use, approvals, monitoring, evaluation, human review, and implementation tradeoffs.
- Do not request secrets, passwords, API keys, private customer data, regulated data, or confidential customer names.
- Do not mark the package ready until you understand business context, current workflow, pain, tools/data, decision boundaries, success criteria, and a sensible first POC.
- Maintain a draft POC package on every turn. Unknowns are allowed in the draft, but label them as TBD instead of inventing facts.
- Use tools when public context would materially sharpen the next question or package. If a user names a public company, product, regulation, or gives a public URL, call a tool before relying on memory. If tools are unavailable or return thin results, continue interviewing without pretending you researched it.
- When tool results are used, include a short Sources section in the draft/final package with public URLs. Never cite a tool result you did not actually receive.
- Never expose hidden reasoning or chain-of-thought. Show only useful status, conclusions, questions, and options.

Visible response style:
- learned: max 12 words. One concrete signal, not a paragraph.
- question: max 16 words. One question only.
- assistantMessage: max 35 words. One sentence. No Markdown, bullets, headings, broad examples, or preamble.
- suggestedReplies: 2-3 concise first-person options the visitor can tap. Max 7 words each. Make them mutually different and useful.
- Full Markdown belongs only in draftPackageMarkdown/packageMarkdown. Never put report sections, source lists, or chain-of-thought in assistantMessage.

When not ready:
- Return one concise assistantMessage, learned, question, and suggestedReplies.
- ready must be false.
- draftPackageMarkdown must contain the current best Markdown draft using the package structure, with TBD for missing sections.
- packageMarkdown and packageHtml must be null.

When ready:
- Return a message saying you have enough to package the POC and ask the visitor to leave their email so Essam can follow up.
- ready must be true.
- packageMarkdown must contain a complete Markdown package using this structure:
${packageTemplate}
- draftPackageMarkdown must match packageMarkdown or be an equally complete current draft.
- packageHtml may contain clean semantic HTML for the same package, or null if Markdown is enough.
- learned should summarize the POC direction. question should ask for the visitor's email.

Return JSON only with this schema:
{
  "assistantMessage": string,
  "learned": string | null,
  "question": string | null,
  "suggestedReplies": string[],
  "ready": boolean,
  "packageTitle": string | null,
  "draftPackageMarkdown": string | null,
  "packageMarkdown": string | null,
  "packageHtml": string | null
}`;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json({ message: "Invalid JSON body." }, { status: 400 });
    }

    const { language, messages } = parseBody(body);
    if (!messages.length) {
        return json({ message: "At least one message is required." }, { status: 400 });
    }

    const maxRequests = readRateLimitNumber(env.SERVICES_CHAT_RATE_LIMIT, 30);
    const rateLimit = checkRateLimit({
        key: `services-chat:${clientRateLimitKey(request, getClientAddress)}`,
        max: maxRequests,
        windowMs: chatRateLimitWindowMs,
    });

    if (rateLimit.limited) {
        return json(
            {
                code: "rate_limited",
                message: language === "ar"
                    ? "طلبات كتير بسرعة. جرّب تاني بعد شوية."
                    : "Too many requests too quickly. Try again in a few minutes.",
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(rateLimit.retryAfter),
                },
            },
        );
    }

    const apiKey = env.DEEPSEEK_API_KEY;

    if (env.SERVICES_CHAT_MODE === "mock") {
        return json(buildMockResponse(language, messages));
    }

    if (!apiKey) {
        console.error("[services-chat] DeepSeek API key is missing; refusing to run intake chat without an LLM.");
        return json({
            code: "missing_deepseek_key",
            configured: false,
            message: "The intake agent is temporarily unavailable.",
        });
    }

    const deepSeekMessages: DeepSeekMessage[] = [
        {
            role: "system",
            content: `${systemPrompt}\n\nPreferred UI language: ${language === "ar" ? "Arabic" : "English"}.`,
        },
        ...messages,
    ];

    let modelResult: { content: string; usedTools: string[] };
    try {
        modelResult = await runDeepSeekWithTools(apiKey, deepSeekMessages);
    } catch (error) {
        return json(
            {
                code: "deepseek_unavailable",
                message: "DeepSeek request failed.",
                detail: providerErrorMessage(error, "DeepSeek"),
            },
            { status: 502 },
        );
    }

    let parsed;
    try {
        parsed = parseModelJson(modelResult.content, modelResult.usedTools);
    } catch (error) {
        const reason = error instanceof Error ? error.message : "Invalid model response.";
        console.error("[services-chat] DeepSeek response violated the intake schema; retrying once.", {
            reason,
        });

        try {
            const repairedContent = await repairDeepSeekResponse(
                apiKey,
                deepSeekMessages,
                modelResult.content,
                reason,
            );
            parsed = parseModelJson(repairedContent, modelResult.usedTools);
        } catch (repairError) {
            const repairReason = repairError instanceof Error
                ? repairError.message
                : "Invalid repaired model response.";
            console.error("[services-chat] DeepSeek response repair failed.", {
                reason: repairReason,
            });

            return json(
                {
                    code: "invalid_model_response",
                    message: language === "ar"
                        ? "الرد طلع مش واضح. ابعته تاني."
                        : "I could not get a clean response. Send that again.",
                },
                { status: 502 },
            );
        }
    }

    return json(parsed);
};

async function runDeepSeekWithTools(apiKey: string, initialMessages: DeepSeekMessage[]) {
    let messages = initialMessages;
    const usedTools: string[] = [];
    const toolsEnabled = hasConfiguredServiceTools(env);

    for (let round = 0; round <= maxToolRounds; round += 1) {
        const data = await requestDeepSeek(apiKey, messages, toolsEnabled && round < maxToolRounds);
        const modelMessage = extractDeepSeekMessage(data);

        if (!modelMessage) {
            throw new Error("DeepSeek returned an invalid response.");
        }

        const toolCalls = modelMessage.tool_calls?.slice(0, 2) || [];
        if (!toolCalls.length || round === maxToolRounds) {
            return {
                content: typeof modelMessage.content === "string" ? modelMessage.content : "",
                usedTools,
            };
        }

        messages = [
            ...messages,
            {
                role: "assistant",
                content: typeof modelMessage.content === "string" ? modelMessage.content : null,
                tool_calls: toolCalls,
            },
            ...await Promise.all(toolCalls.map(async (toolCall) => {
                usedTools.push(toolCall.function.name);
                return {
                    role: "tool" as const,
                    tool_call_id: toolCall.id,
                    content: await executeServiceTool(toolCall, env),
                };
            })),
        ];
    }

    return { content: "", usedTools };
}

async function repairDeepSeekResponse(
    apiKey: string,
    messages: DeepSeekMessage[],
    invalidContent: string,
    reason: string,
) {
    const repairMessages: DeepSeekMessage[] = [
        ...messages,
        {
            role: "assistant",
            content: invalidContent.slice(0, 4000) || "(empty response)",
        },
        {
            role: "user",
            content: [
                "Your previous response failed the required JSON contract.",
                `Failure: ${reason}`,
                "Return a valid JSON object only. Do not apologize. Do not add prose outside JSON.",
                "Continue the same intake turn with short learned, one sharp next question, 2-3 useful suggestedReplies, and draftPackageMarkdown.",
                "If the visitor only gave a role/title, ask which workflow under that role should be improved.",
            ].join("\n"),
        },
    ];
    const data = await requestDeepSeek(apiKey, repairMessages, false);
    const modelMessage = extractDeepSeekMessage(data);
    if (!modelMessage || typeof modelMessage.content !== "string") {
        throw new Error("DeepSeek repair returned an invalid response.");
    }
    return modelMessage.content;
}

async function requestDeepSeek(apiKey: string, messages: DeepSeekMessage[], includeTools: boolean) {
    const response = await fetchWithTimeout(
        env.DEEPSEEK_API_URL || deepSeekEndpoint,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: env.DEEPSEEK_MODEL || "deepseek-v4-pro",
                messages,
                thinking: { type: "disabled" },
                response_format: { type: "json_object" },
                max_tokens: 2800,
                stream: false,
                ...(includeTools
                    ? {
                        tools: serviceToolDefinitions,
                        tool_choice: "auto",
                    }
                    : {}),
            }),
        },
        readPositiveNumber(env.DEEPSEEK_TIMEOUT_MS, defaultDeepSeekTimeoutMs),
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText.slice(0, 1000) || `DeepSeek returned HTTP ${response.status}.`);
    }

    return await response.json();
}

function extractDeepSeekMessage(data: unknown): { content?: unknown; tool_calls?: DeepSeekToolCall[] } | null {
    if (!data || typeof data !== "object") return null;

    const choices = (data as { choices?: unknown }).choices;
    if (!Array.isArray(choices)) return null;

    const firstChoice = choices[0];
    if (!firstChoice || typeof firstChoice !== "object") return null;

    const message = (firstChoice as { message?: unknown }).message;
    if (!message || typeof message !== "object") return null;

    const candidate = message as { content?: unknown; tool_calls?: unknown };
    const toolCalls = Array.isArray(candidate.tool_calls)
        ? candidate.tool_calls
            .map(normalizeToolCall)
            .filter((toolCall): toolCall is DeepSeekToolCall => Boolean(toolCall))
        : undefined;

    return {
        content: candidate.content,
        tool_calls: toolCalls,
    };
}

function normalizeToolCall(value: unknown): DeepSeekToolCall | null {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const fn = record.function && typeof record.function === "object"
        ? record.function as Record<string, unknown>
        : {};
    const id = typeof record.id === "string" ? record.id : crypto.randomUUID();
    const name = typeof fn.name === "string" ? fn.name : "";
    const args = typeof fn.arguments === "string" ? fn.arguments : "{}";

    if (!name) return null;
    return {
        id,
        type: "function",
        function: {
            name,
            arguments: args,
        },
    };
}

function parseBody(body: unknown): { language: Language; messages: PublicMessage[] } {
    const parsed = requestBodySchema.safeParse(body);
    if (!parsed.success) return { language: "en", messages: [] };
    return parsed.data;
}

function parseModelJson(
    content: string,
    usedTools: string[] = [],
) {
    const parsedJson = JSON.parse(extractJsonObject(content)) as unknown;
    const validated = modelResponseSchema.safeParse(parsedJson);
    if (!validated.success) {
        throw new Error("Invalid model response shape.");
    }

    const parsed = validated.data;
    const assistantMessage = compactOneLine(parsed.assistantMessage, 220) || "";
    const learned = compactOneLine(parsed.learned, 95);
    const question = compactOneLine(parsed.question, 120);
    const packageMarkdown = parsed.packageMarkdown?.trim() || "";
    const draftPackageMarkdown = parsed.draftPackageMarkdown?.trim() || packageMarkdown;
    const packageHtml = parsed.packageHtml?.trim() || "";
    const packageIsComplete = hasRequiredPackageSections(packageMarkdown);
    const ready = parsed.ready && packageIsComplete;

    if (!assistantMessage && !learned && !question) {
        throw new Error("Model response is missing visible intake text.");
    }

    if (!draftPackageMarkdown) {
        throw new Error("Model response is missing draftPackageMarkdown.");
    }

    if (parsed.ready && !packageIsComplete) {
        throw new Error("Model marked ready without a complete package.");
    }

    return {
        assistantMessage: buildAssistantMessage({
            assistantMessage: compactAssistantMessage({
                assistantMessage,
                learned,
                question,
            }),
        }),
        learned,
        question,
        suggestedReplies: normalizeSuggestions(parsed.suggestedReplies),
        ready,
        packageTitle: parsed.packageTitle || null,
        draftPackageMarkdown,
        packageMarkdown: ready ? packageMarkdown : null,
        packageHtml: ready && packageHtml ? packageHtml : null,
        usedTools,
    };
}

function compactAssistantMessage({
    assistantMessage,
    learned,
    question,
}: {
    assistantMessage: string;
    learned: string | null;
    question: string | null;
}) {
    if (learned || question) {
        return [
            learned ? `${planningAgentLabel}: ${learned}` : "",
            question || "",
        ].filter(Boolean).join("\n\n");
    }

    return compactVisibleText(assistantMessage, 420);
}

function compactOneLine(value: unknown, maxLength: number) {
    if (typeof value !== "string") return null;
    const compacted = cleanInline(value);
    return compacted ? compactVisibleText(compacted, maxLength) : null;
}

function normalizeSuggestions(value: unknown) {
    if (!Array.isArray(value)) return [];
    const suggestions = value
        .map((item) => compactOneLine(item, 55))
        .filter((item): item is string => Boolean(item))
        .slice(0, 3);

    return suggestions;
}

function compactVisibleText(value: string, maxLength: number) {
    const compacted = value
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim();

    if (compacted.length <= maxLength) return compacted;
    const slice = compacted.slice(0, maxLength).replace(/\s+\S*$/, "");
    return `${slice.trim()}...`;
}

function cleanInline(value: string) {
    return value
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#>*_`|[\]()]/g, "")
        .replace(/^\s*[-+]\s+/gm, "")
        .replace(/\s+/g, " ")
        .trim();
}

const planningAgentLabel = "Planning agent";

function extractJsonObject(content: string) {
    const trimmed = content.trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

    if (trimmed.startsWith("{")) return trimmed;

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return trimmed.slice(start, end + 1);

    return trimmed;
}

function hasRequiredPackageSections(packageMarkdown: string) {
    if (!packageMarkdown) return false;
    const normalized = packageMarkdown.toLowerCase();
    return requiredPackageSections.every((section) => normalized.includes(section));
}

function buildAssistantMessage({ assistantMessage }: { assistantMessage: string }) {
    return assistantMessage;
}

function buildMockResponse(language: Language, messages: PublicMessage[]) {
    const userMessages = messages.filter((message) => message.role === "user");
    const latestUserMessage = userMessages.at(-1)?.content || "";

    if (userMessages.length < 2) {
        const draftPackageMarkdown = [
            "# Agentic Pipeline POC Package",
            "",
            "## 1. Business Snapshot",
            "TBD. The visitor has named a workflow, but owner, frequency, urgency, and business value still need detail.",
            "",
            "## 2. Current Workflow",
            latestUserMessage || "TBD. The current trigger and path are still being clarified.",
            "",
            "## 3. Pain And Opportunity",
            "Likely pain is still being tested. Current hypothesis: unclear decisions, slow handoffs, duplicate work, or missing audit trail.",
            "",
            "## 4. Tools, Data, And Access",
            "TBD. Need systems, documents, APIs, permissions, and constraints.",
            "",
            "## 5. Human Review Boundaries",
            "TBD. Need which actions the agent can do alone and which require approval.",
            "",
            "## 6. Candidate Agentic Pipelines",
            "| Pipeline | Trigger | Inputs | Agent Actions | Human Review | Output | Risk | Expected Value | Complexity |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
            "| Intake clarification | TBD | Visitor answers | Identify owners, decisions, and missing context | Consultant review | POC direction | Thin context | Better discovery | Low |",
            "",
            "## 7. Recommended Free Design POC",
            "TBD. Needs a clearer workflow decision point first.",
            "",
            "## 8. Build Path If The POC Looks Right",
            "TBD.",
            "",
            "## 9. Questions For Essam",
            "- What starts the workflow?",
            "- Who owns the next decision?",
        ].join("\n");

        return {
            assistantMessage: language === "ar"
                ? "واضح إن فيه سير عمل محتاج ترتيب، بس لسه محتاج أعرف نقطة القرار. لما الطلب يدخل، مين أول شخص أو نظام بيقرر الخطوة الجاية؟"
                : "I see the workflow shape, but I need the decision point. When a request arrives, who or what decides the next step?",
            learned: language === "ar"
                ? "فيه سير عمل واضح بس نقطة القرار لسه ناقصة."
                : "Workflow shape is visible; decision ownership is missing.",
            question: language === "ar"
                ? "لما الطلب يدخل، مين أو إيه بيقرر الخطوة الجاية؟"
                : "When a request arrives, who or what decides the next step?",
            suggestedReplies: language === "ar"
                ? ["شخص محدد بيقرر", "نظام بيعمل routing", "القرار بيتنقل بين فرق"]
                : ["A person decides", "A system routes it", "It bounces between teams"],
            ready: false,
            packageTitle: null,
            draftPackageMarkdown,
            packageMarkdown: null,
            packageHtml: null,
            usedTools: [],
        };
    }

    const packageMarkdown = [
        "# Agentic Pipeline POC Package",
        "",
        "## 1. Business Snapshot",
        "Visitor is exploring an agentic pipeline for an intake workflow with unclear ownership and duplicated work.",
        "",
        "## 2. Current Workflow",
        latestUserMessage || "The workflow receives requests from multiple channels and needs triage.",
        "",
        "## 3. Pain And Opportunity",
        "The likely pain is duplicate assignments, unclear approval boundaries, slow triage, and missing visibility into request state.",
        "",
        "## 4. Tools, Data, And Access",
        "Needs channel access, request history, team ownership rules, escalation policy, and approved knowledge sources.",
        "",
        "## 5. Human Review Boundaries",
        "The agent can classify, deduplicate, draft replies, and recommend owners. Human approval should stay on customer-impacting actions until reviewed.",
        "",
        "## 6. Candidate Agentic Pipelines",
        "| Pipeline | Trigger | Inputs | Agent Actions | Human Review | Output | Risk | Expected Value | Complexity |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        "| Intake triage | New request | Message + history | Classify, dedupe, route | Edge cases | Assigned request | Wrong route | Faster handoff | Medium |",
        "",
        "## 7. Recommended Free Design POC",
        "Design a small intake triage POC that reads sample requests, detects duplicates, recommends owner/status, and produces an auditable handoff note.",
        "",
        "## 8. Build Path If The POC Looks Right",
        "Connect the real channels, add approval gates, log decisions, and evaluate routing quality before automating actions.",
        "",
        "## 9. Questions For Essam",
        "- Which request categories matter most?",
        "- What actions require human approval?",
        "- What data source is the source of truth for ownership?",
    ].join("\n");

    return {
        assistantMessage: language === "ar"
            ? "عندي تفاصيل كفاية أجهز POC package مبدئية. سيب إيميلك عشان عصام يراجع الترانسكريبت والبريف ويرجعلك."
            : "I have enough signal to package a first POC. Leave your email so Essam can review the transcript and brief, then follow up.",
        learned: language === "ar"
            ? "أول POC مناسب هو triage مع audit notes."
            : "First POC should be intake triage with audit notes.",
        question: language === "ar"
            ? "سيب إيميلك عشان عصام يراجع البريف ويتابع معاك؟"
            : "Leave your email so Essam can review the brief and follow up?",
        suggestedReplies: [],
        ready: true,
        packageTitle: "Mock Agentic Pipeline POC Package",
        draftPackageMarkdown: packageMarkdown,
        packageMarkdown,
        packageHtml: null,
        usedTools: [],
    };
}
