import { query } from "./_generated/server";

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return { isAdmin: false, error: "ADMIN_EMAIL not configured" };
    }

    // Get the current user from Better Auth session
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isAdmin: false, error: null };
    }

    const userEmail = identity.email;
    return {
      isAdmin: userEmail === adminEmail,
      error: null
    };
  },
});
