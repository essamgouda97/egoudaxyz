import { createAuthClient } from "better-auth/svelte";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { convexClientInstance } from "./convex-client";

export const authClient = createAuthClient({
  plugins: [convexClient({ client: convexClientInstance })],
});
