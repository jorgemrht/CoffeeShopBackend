import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callWorkerTool, listWorkerTools, type ToolDefinition } from "./workerContract.js";
import type { ContractSnapshot } from "./types.js";

export type SnapshotState = {
  currentSnapshot: ContractSnapshot;
  snapshotIndex: Record<string, ContractSnapshot>;
};

export function createMcpServer(loadSnapshotState: () => Promise<SnapshotState>): McpServer {
  const server = new McpServer({
    name: "coffeeshop-bruno-contract-mcp",
    version: "0.2.0"
  });

  for (const tool of listWorkerTools()) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: toZodObjectSchema(tool),
        annotations: tool.annotations
      },
      async (args) => {
        const { currentSnapshot, snapshotIndex } = await loadSnapshotState();
        return callWorkerTool(tool.name, args, currentSnapshot, snapshotIndex);
      }
    );
  }

  return server;
}

function toZodObjectSchema(tool: ToolDefinition) {
  const schema = tool.inputSchema;
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const entries = Object.entries(properties).map(([key, value]) => [key, toZodSchema(value)]);
  return z.object(Object.fromEntries(entries));
}

function toZodSchema(input: unknown): z.ZodTypeAny {
  if (!isRecord(input)) {
    return z.any();
  }

  if (input.type === "integer") {
    let schema = z.number().int();
    if (typeof input.minimum === "number") schema = schema.min(input.minimum);
    if (typeof input.maximum === "number") schema = schema.max(input.maximum);
    if ("default" in input && typeof input.default === "number") {
      return schema.default(input.default);
    }
    return schema.optional();
  }

  if (Array.isArray(input.enum) && input.enum.every((item) => typeof item === "string")) {
    const values = input.enum as [string, ...string[]];
    let schema = z.enum(values);
    if ("default" in input && typeof input.default === "string" && values.includes(input.default)) {
      return schema.default(input.default);
    }
    return schema.optional();
  }

  if (input.type === "string") {
    let schema = z.string();
    if (typeof input.minLength === "number") schema = schema.min(input.minLength);
    if ("default" in input && typeof input.default === "string") {
      return schema.default(input.default);
    }
    return schema.optional();
  }

  return z.any().optional();
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
