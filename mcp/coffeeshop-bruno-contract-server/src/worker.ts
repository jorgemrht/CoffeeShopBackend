import { createMcpHandler } from "agents/mcp";
import { currentSnapshot, snapshotIndex } from "./generated/contractData.js";
import { createMcpServer } from "./mcpServer.js";
import type { SnapshotState } from "./mcpServer.js";

const publishedSnapshotState: SnapshotState = {
  currentSnapshot,
  snapshotIndex
};

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        service: "coffeeshop-bruno-contract-mcp",
        snapshotVersion: currentSnapshot.snapshotVersion,
        generatedAt: currentSnapshot.generatedAt
      });
    }

    if (request.method === "GET" && url.pathname === "/contract/latest") {
      return json(currentSnapshot);
    }

    const server = createMcpServer(async () => publishedSnapshotState);
    return createMcpHandler(server, {
      route: "/mcp",
      enableJsonResponse: true
    })(request, env, ctx as any);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
