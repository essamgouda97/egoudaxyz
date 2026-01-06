/**
 * Proxy for arabify endpoints to backend.
 */

import { env } from "$env/dynamic/private";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const backendUrl = () => env.BACKEND_URL || "http://localhost:8000";

export const POST: RequestHandler = async ({ request, url }) => {
  const endpoint = url.searchParams.get("endpoint") || "tweet";
  const targetUrl = `${backendUrl()}/api/v1/arabify/${endpoint}`;

  try {
    const body = await request.json();

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return json(data, { status: response.status });
    }

    return json(data);
  } catch (error) {
    console.error("Arabify proxy error:", error);
    return json({ error: "Failed to connect to backend" }, { status: 502 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  const tweetUrl = url.searchParams.get("url");

  if (!tweetUrl) {
    return json({ error: "URL parameter required" }, { status: 400 });
  }

  const targetUrl = `${backendUrl()}/api/v1/arabify/preview?url=${encodeURIComponent(tweetUrl)}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();

    if (!response.ok) {
      return json(data, { status: response.status });
    }

    return json(data);
  } catch (error) {
    console.error("Preview proxy error:", error);
    return json({ error: "Failed to connect to backend" }, { status: 502 });
  }
};
