import { servicesLlmText } from "$lib/server/services-llm-text";

export const GET = () =>
    new Response(servicesLlmText, {
        headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
        },
    });
