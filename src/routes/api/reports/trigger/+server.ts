/**
 * Proxy to trigger a new monitoring report.
 */

import { env } from "$env/dynamic/private";
import { json } from "@sveltejs/kit";

export async function POST() {
  const backendUrl = env.BACKEND_URL || "http://localhost:8000";

  try {
    const response = await fetch(`${backendUrl}/api/v1/reports/trigger`, {
      method: "POST",
    });

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error("Failed to trigger report:", error);
    return json({ error: "Failed to trigger report" }, { status: 502 });
  }
}
