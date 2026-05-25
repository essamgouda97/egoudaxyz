export type ServicesLanguage = "en" | "ar";

export const SERVICES_LANGUAGE_KEY = "services-language";
export const SERVICES_LANGUAGE_MAX_AGE = 60 * 60 * 24 * 365;

export function isServicesLanguage(
    value: string | null | undefined,
): value is ServicesLanguage {
    return value === "en" || value === "ar";
}
