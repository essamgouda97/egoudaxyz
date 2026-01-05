/**
 * Proxy endpoint to fetch available agents from the backend.
 */

import { env } from "$env/dynamic/private";
import { json } from "@sveltejs/kit";

export async function GET() {
  const backendUrl = env.BACKEND_URL || "http://localhost:8000";

  try {
    const response = await fetch(`${backendUrl}/api/v1/agents`);

    if (!response.ok) {
      return json({ error: "Failed to fetch agents" }, { status: response.status });
    }

    const agents = await response.json();
    return json(agents);
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return json({ error: "Failed to connect to backend" }, { status: 502 });
  }
}
