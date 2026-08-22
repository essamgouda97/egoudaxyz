import { readPortfolioLayout } from "$lib/server/portfolio-layout";
import type { PageServerLoad } from "./$types";

export const load = (({ cookies }) =>
    readPortfolioLayout(cookies)) satisfies PageServerLoad;
