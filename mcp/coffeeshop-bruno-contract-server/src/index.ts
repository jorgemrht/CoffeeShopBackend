import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildSnapshot, createContext } from "./contract.js";
import { createMcpServer } from "./mcpServer.js";
import type { SnapshotState } from "./mcpServer.js";

const context = createContext();
const server = createMcpServer(loadLocalSnapshotState);

const transport = new StdioServerTransport();
await server.connect(transport);

async function loadLocalSnapshotState(): Promise<SnapshotState> {
  const currentSnapshot = await buildSnapshot(context, "current");
  return { currentSnapshot };
}
