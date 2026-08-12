export const servicesOfferName = "One-week AI workflow sprint";
export const servicesOfferDescription =
    "Requirements call, one focused build week, and a two-hour setup and review call.";

const defaultPriceCents = 25_000;
const defaultCurrency = "cad";
const supportedCurrencies = new Set(["cad", "usd"]);

export type ServicesOfferConfig = {
    amountCents: number;
    currency: string;
    displayPrice: string;
};

export function readServicesOfferConfig(env: {
    SERVICES_PRICE_CENTS?: string;
    SERVICES_CURRENCY?: string;
}): ServicesOfferConfig {
    const parsedAmount = Number.parseInt(env.SERVICES_PRICE_CENTS ?? "", 10);
    const amountCents =
        Number.isFinite(parsedAmount) && parsedAmount > 0
            ? parsedAmount
            : defaultPriceCents;
    const requestedCurrency = env.SERVICES_CURRENCY?.trim().toLowerCase();
    const currency =
        requestedCurrency && supportedCurrencies.has(requestedCurrency)
            ? requestedCurrency
            : defaultCurrency;

    return {
        amountCents,
        currency,
        displayPrice: new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: currency.toUpperCase(),
            maximumFractionDigits: 0,
        }).format(amountCents / 100),
    };
}

export function readServicesPaidBookingUrl(value?: string) {
    const candidate = value?.trim();
    if (!candidate) return null;

    try {
        const bookingUrl = new URL(candidate);
        if (
            bookingUrl.protocol !== "https:" ||
            bookingUrl.username ||
            bookingUrl.password
        ) {
            return null;
        }

        return bookingUrl.toString();
    } catch {
        return null;
    }
}
