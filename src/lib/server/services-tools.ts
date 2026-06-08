import {
    fetchWithTimeout,
    providerErrorMessage,
    readPositiveNumber,
} from "$lib/server/provider-fetch";

type PrivateEnv = Record<string, string | undefined>;

export type DeepSeekToolCall = {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
};

const defaultToolTimeoutMs = 12_000;
const maxToolOutputLength = 6000;

export const serviceToolDefinitions = [
    {
        type: "function",
        function: {
            name: "web_search",
            description:
                "Search the public web for business or workflow context when the visitor names a public company, product, industry, or regulation. Use only when external context would make the next question or POC sharper.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "A specific public-web search query.",
                    },
                    reason: {
                        type: "string",
                        description: "Why this search is needed for the POC intake.",
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "fetch_web_page",
            description:
                "Fetch a public URL as clean Markdown using Cloudflare Browser Run. Use when the visitor gives a public website, docs page, product page, or article that can ground the POC. Do not use for private/internal URLs.",
            parameters: {
                type: "object",
                properties: {
                    url: {
                        type: "string",
                        description: "A public http(s) URL to fetch.",
                    },
                    reason: {
                        type: "string",
                        description: "Why this page matters for the intake.",
                    },
                },
                required: ["url"],
            },
        },
    },
] as const;

export function hasConfiguredServiceTools(env: PrivateEnv) {
    return Boolean(
        env.BRAVE_SEARCH_API_KEY ||
            env.SERVICES_WEB_SEARCH_API_URL ||
            env.CLOUDFLARE_BROWSER_MARKDOWN_API_URL ||
            (env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID),
    );
}

export async function executeServiceTool(call: DeepSeekToolCall, env: PrivateEnv) {
    const args = parseToolArguments(call.function.arguments);

    switch (call.function.name) {
        case "web_search":
            return JSON.stringify(await searchWeb(args, env));
        case "fetch_web_page":
            return JSON.stringify(await fetchWebPage(args, env));
        default:
            return JSON.stringify({
                ok: false,
                error: `Unknown tool: ${call.function.name}`,
            });
    }
}

async function searchWeb(args: Record<string, unknown>, env: PrivateEnv) {
    const query = typeof args.query === "string" ? args.query.trim().slice(0, 300) : "";
    const reason = typeof args.reason === "string" ? args.reason.trim().slice(0, 500) : "";

    if (!query) {
        return { ok: false, tool: "web_search", error: "query is required." };
    }

    if (env.SERVICES_WEB_SEARCH_API_URL) {
        return await callGenericSearchEndpoint(query, reason, env);
    }

    if (env.BRAVE_SEARCH_API_KEY) {
        return await searchBrave(query, reason, env);
    }

    return {
        ok: false,
        tool: "web_search",
        error:
            "Web search is not configured. Set BRAVE_SEARCH_API_KEY or SERVICES_WEB_SEARCH_API_URL, or ask the visitor for a public URL and use fetch_web_page.",
    };
}

async function callGenericSearchEndpoint(query: string, reason: string, env: PrivateEnv) {
    try {
        const response = await fetchWithTimeout(
            env.SERVICES_WEB_SEARCH_API_URL!,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(env.SERVICES_WEB_SEARCH_API_KEY
                        ? { Authorization: `Bearer ${env.SERVICES_WEB_SEARCH_API_KEY}` }
                        : {}),
                },
                body: JSON.stringify({ query, reason, count: 5 }),
            },
            readPositiveNumber(env.SERVICES_TOOL_TIMEOUT_MS, defaultToolTimeoutMs),
        );

        const body = await readJsonOrText(response);
        if (!response.ok) {
            return {
                ok: false,
                tool: "web_search",
                error: `Search provider returned HTTP ${response.status}.`,
                detail: compactText(body),
            };
        }

        return {
            ok: true,
            tool: "web_search",
            query,
            reason,
            results: normalizeSearchResults(body),
        };
    } catch (error) {
        return {
            ok: false,
            tool: "web_search",
            error: providerErrorMessage(error, "Web search"),
        };
    }
}

async function searchBrave(query: string, reason: string, env: PrivateEnv) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("text_decorations", "false");

    try {
        const response = await fetchWithTimeout(
            url,
            {
                headers: {
                    Accept: "application/json",
                    "X-Subscription-Token": env.BRAVE_SEARCH_API_KEY!,
                },
            },
            readPositiveNumber(env.SERVICES_TOOL_TIMEOUT_MS, defaultToolTimeoutMs),
        );
        const body = await readJsonOrText(response);

        if (!response.ok) {
            return {
                ok: false,
                tool: "web_search",
                error: `Brave Search returned HTTP ${response.status}.`,
                detail: compactText(body),
            };
        }

        const results = Array.isArray((body as { web?: { results?: unknown } }).web?.results)
            ? ((body as { web: { results: unknown[] } }).web.results).map((result) => {
                const record = result && typeof result === "object" ? result as Record<string, unknown> : {};
                return {
                    title: stringValue(record.title),
                    url: stringValue(record.url),
                    snippet: stringValue(record.description),
                };
            })
            : [];

        return { ok: true, tool: "web_search", query, reason, results };
    } catch (error) {
        return {
            ok: false,
            tool: "web_search",
            error: providerErrorMessage(error, "Brave Search"),
        };
    }
}

async function fetchWebPage(args: Record<string, unknown>, env: PrivateEnv) {
    const rawUrl = typeof args.url === "string" ? args.url.trim() : "";
    const reason = typeof args.reason === "string" ? args.reason.trim().slice(0, 500) : "";
    const parsedUrl = parsePublicUrl(rawUrl);

    if (!parsedUrl.ok) {
        return {
            ok: false,
            tool: "fetch_web_page",
            url: rawUrl,
            error: parsedUrl.error,
        };
    }

    const apiUrl = env.CLOUDFLARE_BROWSER_MARKDOWN_API_URL ||
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/markdown`;

    if (!env.CLOUDFLARE_BROWSER_MARKDOWN_API_URL && (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID)) {
        return {
            ok: false,
            tool: "fetch_web_page",
            url: parsedUrl.url,
            error:
                "Cloudflare Browser Run is not configured. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.",
        };
    }

    try {
        const response = await fetchWithTimeout(
            apiUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(env.CLOUDFLARE_API_TOKEN
                        ? { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` }
                        : {}),
                },
                body: JSON.stringify({ url: parsedUrl.url }),
            },
            readPositiveNumber(env.SERVICES_TOOL_TIMEOUT_MS, defaultToolTimeoutMs),
        );
        const body = await readJsonOrText(response);

        if (!response.ok) {
            return {
                ok: false,
                tool: "fetch_web_page",
                url: parsedUrl.url,
                error: `Cloudflare Browser Run returned HTTP ${response.status}.`,
                detail: compactText(body),
            };
        }

        const markdown = extractMarkdownResult(body);
        if (!markdown) {
            return {
                ok: false,
                tool: "fetch_web_page",
                url: parsedUrl.url,
                error: "Cloudflare Browser Run returned no Markdown content.",
                detail: compactText(body),
            };
        }

        return {
            ok: true,
            tool: "fetch_web_page",
            source: "cloudflare_browser_run_markdown",
            url: parsedUrl.url,
            reason,
            markdown: compactText(markdown),
        };
    } catch (error) {
        return {
            ok: false,
            tool: "fetch_web_page",
            url: parsedUrl.url,
            error: providerErrorMessage(error, "Cloudflare Browser Run"),
        };
    }
}

function parseToolArguments(value: string) {
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    } catch {
        return {};
    }
}

function parsePublicUrl(value: string): { ok: true; url: string } | { ok: false; error: string } {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return { ok: false, error: "A valid URL is required." };
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        return { ok: false, error: "Only http(s) URLs are allowed." };
    }

    const hostname = url.hostname.toLowerCase();
    if (
        hostname === "localhost" ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal") ||
        hostname === "0.0.0.0" ||
        hostname.startsWith("127.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
        hostname === "::1" ||
        hostname.startsWith("[")
    ) {
        return { ok: false, error: "Private, local, or internal URLs are not allowed." };
    }

    url.hash = "";
    return { ok: true, url: url.toString() };
}

async function readJsonOrText(response: Response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function extractMarkdownResult(body: unknown) {
    if (typeof body === "string") return body;
    if (!body || typeof body !== "object") return "";
    const result = (body as { result?: unknown }).result;
    return typeof result === "string" ? result : "";
}

function normalizeSearchResults(body: unknown) {
    if (Array.isArray(body)) {
        return body.map(normalizeSearchResult).filter(Boolean).slice(0, 5);
    }

    if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;
        const candidates = [record.results, record.items, record.web].find(Array.isArray) as unknown[] | undefined;
        if (candidates) return candidates.map(normalizeSearchResult).filter(Boolean).slice(0, 5);
    }

    return [{ title: "Search response", url: "", snippet: compactText(body) }];
}

function normalizeSearchResult(value: unknown) {
    const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const title = stringValue(record.title || record.name);
    const url = stringValue(record.url || record.link);
    const snippet = stringValue(record.snippet || record.description || record.content);

    if (!title && !url && !snippet) return null;
    return { title, url, snippet };
}

function stringValue(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function compactText(value: unknown) {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maxToolOutputLength);
}
