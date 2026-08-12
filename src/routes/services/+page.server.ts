import {
    isServicesLanguage,
    SERVICES_LANGUAGE_MAX_AGE,
    SERVICES_LANGUAGE_KEY,
    type ServicesLanguage,
} from "$lib/services-language";
import { env } from "$env/dynamic/private";
import {
    readServicesOfferConfig,
    readServicesPaidBookingUrl,
} from "$lib/server/services-offer";
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

        return buildPageData(queryLanguage);
    }

    const language = cookies.get(SERVICES_LANGUAGE_KEY);

    return buildPageData(
        isServicesLanguage(language) ? language : DEFAULT_LANGUAGE,
    );
};

function buildPageData(language: ServicesLanguage) {
    const offer = readServicesOfferConfig({
        SERVICES_PRICE_CENTS: env.SERVICES_PRICE_CENTS,
        SERVICES_CURRENCY: env.SERVICES_CURRENCY,
    });
    const paidBookingUrl = readServicesPaidBookingUrl(
        env.SERVICES_PAID_BOOKING_URL,
    );

    return {
        language,
        offer,
        bookingConfigured: Boolean(paidBookingUrl),
        paidBookingUrl,
    };
}
