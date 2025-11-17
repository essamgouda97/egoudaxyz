import { query } from "./_generated/server";

export const getAdminEmail = query({
  args: {},
  handler: async () => {
    return process.env.ADMIN_EMAIL || null;
  },
});
