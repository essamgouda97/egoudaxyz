import { redirect, error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { env } from "$env/dynamic/private";

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.token) {
    throw redirect(307, "/login");
  }

  const adminEmail = env.ADMIN_EMAIL;

  if (!adminEmail) {
    throw error(500, "ADMIN_EMAIL not configured");
  }

  let userEmail = null;
  if (typeof locals.token === 'string') {
    try {
      const payload = JSON.parse(atob(locals.token.split('.')[1]));
      userEmail = payload.email || payload.user?.email;
    } catch (e) {
      // Not a JWT
    }
  } else if (typeof locals.token === 'object') {
    userEmail = (locals.token as any).email || (locals.token as any).user?.email;
  }

  if (!userEmail || userEmail !== adminEmail) {
    throw error(403, "Unauthorized: Admin access only");
  }

  return {};
};
