/**
 * Proxy to fetch the latest monitoring report from the backend.
 */

import { env } from "$env/dynamic/private";
import { json } from "@sveltejs/kit";

export async function GET() {
  const backendUrl = env.BACKEND_URL || "http://localhost:8000";

  try {
    const response = await fetch(`${backendUrl}/api/v1/reports/latest`);

    if (!response.ok) {
      if (response.status === 404) {
        return json({ error: "No reports available yet" }, { status: 404 });
      }
      return json({ error: "Failed to fetch report" }, { status: response.status });
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error("Failed to fetch latest report:", error);
    return json({ error: "Backend unavailable" }, { status: 502 });
  }
}
