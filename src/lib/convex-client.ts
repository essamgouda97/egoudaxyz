import { ConvexClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";

export const convexClientInstance = new ConvexClient(PUBLIC_CONVEX_URL);
