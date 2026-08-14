import { env } from "$env/dynamic/private";
import {
    fetchWithTimeout,
    providerErrorMessage,
    readPositiveNumber,
} from "$lib/server/provider-fetch";
import {
    checkRateLimit,
    clientRateLimitKey,
    readRateLimitNumber,
} from "$lib/server/rate-limit";
import {
    readServicesOfferConfig,
    servicesOfferDescription,
    servicesOfferName,
} from "$lib/server/services-offer";
import { json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";

const deepSeekEndpoint = "https://api.deepseek.com/chat/completions";
const questionRateLimitWindowMs = 15 * 60 * 1000;
const defaultTimeoutMs = 15_000;

const requestSchema = z.object({
    question: z.string().trim().min(2).max(600),
    language: z.enum(["en", "ar"]).catch("en"),
});

const deepSeekResponseSchema = z.object({
    choices: z.array(
        z.object({
            message: z.object({
                content: z.string(),
            }),
        }),
    ).min(1),
});

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
    let input: unknown;
    try {
        input = await request.json();
    } catch {
        return json({ message: "Invalid question." }, { status: 400 });
    }

    const parsedInput = requestSchema.safeParse(input);
    if (!parsedInput.success) {
        return json(
            { message: "Ask one short question, up to 600 characters." },
            { status: 400 },
        );
    }

    const { question, language } = parsedInput.data;
    const offlineMessage =
        language === "ar"
            ? "الأسئلة واقفة دلوقتي. ابعت إيميل لـ egouda@bokralabs.com."
            : "Questions are offline. Email egouda@bokralabs.com.";

    const rateLimit = checkRateLimit({
        key: `services-question:${clientRateLimitKey(request, getClientAddress)}`,
        max: readRateLimitNumber(env.SERVICES_QUESTION_RATE_LIMIT, 20),
        windowMs: questionRateLimitWindowMs,
    });
    if (rateLimit.limited) {
        return json(
            {
                message:
                    language === "ar"
                        ? "أسئلة كتير أوي. ابعت إيميل لـ egouda@bokralabs.com بدل كده."
                        : "Too many questions. Email egouda@bokralabs.com instead.",
            },
            {
                status: 429,
                headers: { "Retry-After": String(rateLimit.retryAfter) },
            },
        );
    }

    if (env.SERVICES_QUESTION_MODE === "mock") {
        return json({
            answer:
                language === "ar"
                    ? "Workflow واحدة: مكالمة الحد، ٦ أيام بناء، " +
                      "وساعتين تركيب وتسليم الحد اللي بعده."
                    : "One workflow: Sunday scope call, six build days, " +
                      "then a two-hour Sunday setup and handoff.",
        });
    }

    const apiKey = env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) {
        return json({ message: offlineMessage }, { status: 503 });
    }

    const offer = readServicesOfferConfig({
        SERVICES_PRICE_CENTS: env.SERVICES_PRICE_CENTS,
        SERVICES_CURRENCY: env.SERVICES_CURRENCY,
    });
    const systemPrompt = `You answer short pre-sale questions for Essam Gouda's services page.

Offer facts:
- ${servicesOfferName}: ${offer.displayPrice} ${offer.currency.toUpperCase()}, paid once per sprint.
- ${servicesOfferDescription}
- Essam builds one specific AI workflow around the client's day-to-day work and own data.
- Requirements and review calls are booked on Sundays.
- Cal.com confirms a Sunday booking only after its Stripe payment succeeds.
- Contact: egouda@bokralabs.com.

Rules:
- Reply in ${language === "ar" ? "natural Egyptian Arabic" : "plain English"}.
- Maximum 35 words. No greeting, pitch, headings, or Markdown.
- Answer only from the facts above.
- Do not promise integrations, timelines, refunds, legal terms, availability, or scope not stated here.
- When the answer depends on Essam, say to email egouda@bokralabs.com.`;

    try {
        const response = await fetchWithTimeout(
            env.DEEPSEEK_API_URL || deepSeekEndpoint,
            {
                method: "POST",
                headers: {
                    authorization: `Bearer ${apiKey}`,
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    model: env.DEEPSEEK_MODEL || "deepseek-v4-pro",
                    temperature: 0.2,
                    max_tokens: 180,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: question },
                    ],
                }),
            },
            readPositiveNumber(env.DEEPSEEK_TIMEOUT_MS, defaultTimeoutMs),
        );

        if (!response.ok) {
            return json({ message: offlineMessage }, { status: 502 });
        }

        const parsedResponse = deepSeekResponseSchema.safeParse(
            await response.json(),
        );
        const answer = parsedResponse.success
            ? parsedResponse.data.choices[0].message.content.trim()
            : "";

        if (!answer) {
            return json({ message: offlineMessage }, { status: 502 });
        }

        return json({ answer: limitWords(answer, 35) });
    } catch (error) {
        console.error("[services-question]", providerErrorMessage(error, "DeepSeek"));
        return json({ message: offlineMessage }, { status: 502 });
    }
};

function limitWords(value: string, maximumWords: number) {
    return value.trim().replace(/\s+/g, " ").split(" ").slice(0, maximumWords).join(" ");
}
