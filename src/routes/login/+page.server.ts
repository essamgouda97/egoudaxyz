import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // If already authenticated, redirect to dashboard
  if (locals.token) {
    throw redirect(303, "/dashboard");
  }
  return {};
};
