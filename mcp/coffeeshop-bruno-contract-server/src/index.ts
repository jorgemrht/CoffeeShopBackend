import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  buildSnapshot,
  createContext,
  listSnapshotVersions,
  loadSnapshot
} from "./contract.js";
import { createMcpServer } from "./mcpServer.js";
import type { SnapshotState } from "./mcpServer.js";
import type { ContractSnapshot } from "./types.js";

const context = createContext();
const server = createMcpServer(loadLocalSnapshotState);

const transport = new StdioServerTransport();
await server.connect(transport);

async function loadLocalSnapshotState(): Promise<SnapshotState> {
  const currentSnapshot = await buildSnapshot(context, "current");
  const versions = await listSnapshotVersions(context);
  const snapshotEntries = await Promise.all(
    versions.map(async ({ version }) => [version, await loadSnapshot(context, version)] as const)
  );

  const snapshotIndex = Object.fromEntries(snapshotEntries) as Record<string, ContractSnapshot>;
  snapshotIndex.current = currentSnapshot;
  snapshotIndex.latest = snapshotIndex.latest ?? currentSnapshot;

  return { currentSnapshot, snapshotIndex };
}
