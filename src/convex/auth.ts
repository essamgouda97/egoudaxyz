import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";

// Use SITE_URL for local development, CONVEX_SITE_URL for production
const baseURL = process.env.SITE_URL!;

const authComponent = createClient(components.betterAuth);

export const createAuth = (ctx: any, { optionsOnly } = { optionsOnly: false }) => {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL,
    trustedOrigins: [
      process.env.SITE_URL!,
      baseURL,
      "https://egouda.xyz",
      "http://localhost:5173"
    ],
    database: authComponent.adapter(ctx),
    socialProviders: {
      github: {
        clientId: process.env.AUTH_GITHUB_ID!,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      },
    },
    plugins: [convex()],
  });
};

export { authComponent };
