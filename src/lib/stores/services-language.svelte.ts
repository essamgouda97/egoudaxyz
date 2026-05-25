import { browser } from "$app/environment";
import {
    isServicesLanguage,
    SERVICES_LANGUAGE_MAX_AGE,
    SERVICES_LANGUAGE_KEY,
    type ServicesLanguage,
} from "$lib/services-language";

function readCookieLanguage(): ServicesLanguage | undefined {
    if (!browser) return undefined;
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${SERVICES_LANGUAGE_KEY}=`));
    const value = match ? decodeURIComponent(match.split("=")[1] ?? "") : undefined;
    return isServicesLanguage(value) ? value : undefined;
}

function loadLanguage(): ServicesLanguage {
    if (!browser) return "en";
    const saved = localStorage.getItem(SERVICES_LANGUAGE_KEY);
    if (isServicesLanguage(saved)) return saved;
    return readCookieLanguage() ?? "en";
}

function createServicesLanguage() {
    let current = $state<ServicesLanguage>(loadLanguage());

    function save(value: ServicesLanguage) {
        if (!browser) return;
        localStorage.setItem(SERVICES_LANGUAGE_KEY, value);
        document.cookie = `${SERVICES_LANGUAGE_KEY}=${value}; Path=/; Max-Age=${SERVICES_LANGUAGE_MAX_AGE}; SameSite=Lax`;
    }

    return {
        get current() {
            return current;
        },
        set current(value: ServicesLanguage) {
            current = value;
            save(value);
        },
        reset() {
            current = "en";
            if (browser) {
                localStorage.removeItem(SERVICES_LANGUAGE_KEY);
                document.cookie = `${SERVICES_LANGUAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
            }
        },
    };
}

export const servicesLanguage = createServicesLanguage();
