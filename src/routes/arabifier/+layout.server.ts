import { redirect, error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

export const load: LayoutServerLoad = async ({ locals }) => {
  // In dev mode, skip auth check
  if (dev) {
    return {};
  }

  // Require authentication
  if (!locals.token) {
    throw redirect(307, "/login");
  }

  // Admin check via ADMIN_EMAIL env var
  const adminEmail = env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw error(500, "ADMIN_EMAIL not configured");
  }

  // Extract email from token
  let userEmail: string | null = null;
  if (typeof locals.token === "string") {
    try {
      const payload = JSON.parse(atob(locals.token.split(".")[1]));
      userEmail = payload.email || payload.user?.email;
    } catch {
      // Not a JWT
    }
  } else if (typeof locals.token === "object") {
    userEmail = (locals.token as Record<string, unknown>).email as string | null;
  }

  if (!userEmail || userEmail !== adminEmail) {
    throw error(403, "Unauthorized: Admin access only");
  }

  return {};
};
