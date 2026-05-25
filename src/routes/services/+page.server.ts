import {
    isServicesLanguage,
    SERVICES_LANGUAGE_KEY,
    type ServicesLanguage,
} from "$lib/services-language";
import type { PageServerLoad } from "./$types";

const DEFAULT_LANGUAGE: ServicesLanguage = "en";

export const load: PageServerLoad = ({ cookies }) => {
    const language = cookies.get(SERVICES_LANGUAGE_KEY);

    return {
        language: isServicesLanguage(language) ? language : DEFAULT_LANGUAGE,
    };
};
