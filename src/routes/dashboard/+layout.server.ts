import { redirect, error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, platform }) => {
  if (!locals.token) {
    throw redirect(307, "/login");
  }

  // Check if user's email matches ADMIN_EMAIL
  const adminEmail = platform?.env?.ADMIN_EMAIL;
  const userEmail = locals.token.email;

  if (!adminEmail || userEmail !== adminEmail) {
    throw error(403, "Unauthorized: Admin access only");
  }

  return {};
};
