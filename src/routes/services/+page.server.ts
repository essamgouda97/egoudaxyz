import {
    isServicesLanguage,
    SERVICES_LANGUAGE_MAX_AGE,
    SERVICES_LANGUAGE_KEY,
    type ServicesLanguage,
} from "$lib/services-language";
import type { PageServerLoad } from "./$types";

const DEFAULT_LANGUAGE: ServicesLanguage = "en";

export const load: PageServerLoad = ({ cookies, url }) => {
    const queryLanguage = url.searchParams.get("lang");
    if (isServicesLanguage(queryLanguage)) {
        cookies.set(SERVICES_LANGUAGE_KEY, queryLanguage, {
            path: "/",
            maxAge: SERVICES_LANGUAGE_MAX_AGE,
            sameSite: "lax",
        });

        return {
            language: queryLanguage,
        };
    }

    const language = cookies.get(SERVICES_LANGUAGE_KEY);

    return {
        language: isServicesLanguage(language) ? language : DEFAULT_LANGUAGE,
    };
};
