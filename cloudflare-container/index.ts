import { Container, getRandom } from "@cloudflare/containers";

interface Env {
  MARKITDOWN: any;
}

export class MarkItDownContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (!((url.pathname === "/convert" && request.method === "POST") || (url.pathname === "/health" && request.method === "GET"))) {
      return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders() });
    }
    const instance = await getRandom(env.MARKITDOWN, 1);
    const response = await instance.fetch(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    return new Response(response.body, { status: response.status, headers });
  },
};

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "https://mark-down-tool.catofgodot.chatgpt.site",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
