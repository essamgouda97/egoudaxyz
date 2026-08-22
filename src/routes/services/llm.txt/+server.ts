import { dev } from "$app/environment";
import { servicesLlmText } from "$lib/server/services-llm-text";
import { error } from "@sveltejs/kit";

export const GET = () => {
    if (!dev) error(404, "Not found");

    return new Response(servicesLlmText, {
        headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
        },
    });
};
