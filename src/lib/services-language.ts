export type ServicesLanguage = "en" | "ar";

export const SERVICES_LANGUAGE_KEY = "services-language";

export function isServicesLanguage(
    value: string | null | undefined,
): value is ServicesLanguage {
    return value === "en" || value === "ar";
}
