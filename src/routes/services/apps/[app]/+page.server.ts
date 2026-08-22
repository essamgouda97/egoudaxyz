import { dev } from "$app/environment";
import {
    isServicesLanguage,
    SERVICES_LANGUAGE_MAX_AGE,
    SERVICES_LANGUAGE_KEY,
    type ServicesLanguage,
} from "$lib/services-language";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const DEFAULT_LANGUAGE: ServicesLanguage = "en";
const APPS = ["budget", "media", "documents"] as const;

type ServicesApp = (typeof APPS)[number];

function isServicesApp(value: string): value is ServicesApp {
    return APPS.some((app) => app === value);
}

export const load: PageServerLoad = ({ cookies, params, url }) => {
    if (!dev) redirect(302, "/");
    if (!isServicesApp(params.app)) error(404, "Tool not found");

    const queryLanguage = url.searchParams.get("lang");
    if (isServicesLanguage(queryLanguage)) {
        cookies.set(SERVICES_LANGUAGE_KEY, queryLanguage, {
            path: "/",
            maxAge: SERVICES_LANGUAGE_MAX_AGE,
            sameSite: "lax",
        });

        return { app: params.app, language: queryLanguage };
    }

    const savedLanguage = cookies.get(SERVICES_LANGUAGE_KEY);

    return {
        app: params.app,
        language: isServicesLanguage(savedLanguage)
            ? savedLanguage
            : DEFAULT_LANGUAGE,
    };
};
