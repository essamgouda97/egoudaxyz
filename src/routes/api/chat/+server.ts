/**
 * SvelteKit API route that proxies chat requests to the backend.
 * This avoids CORS/mixed-content issues since requests come from the same origin.
 */

import { env } from "$env/dynamic/private";

export async function POST({ request, url }) {
  const backendUrl = env.BACKEND_URL || "http://localhost:8000";
  const agentId = url.searchParams.get("agent") || "default";
  const targetUrl = `${backendUrl}/api/v1/chat/${agentId}`;

  const body = await request.text();

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body,
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Backend error: ${response.status}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stream the response back to the client
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
