import { promises as fs } from "node:fs";
import path from "node:path";
import { buildSnapshot, createContext } from "./contract.js";

const repoRoot = path.resolve(process.env.REPO_ROOT ?? path.join(import.meta.dirname, "../../.."));
const packageRoot = path.join(repoRoot, "mcp/coffeeshop-bruno-contract-server");
const outputFile = path.join(packageRoot, "src/generated/contractData.ts");

const version = process.argv[2] ?? `sha-${(process.env.GITHUB_SHA ?? "local").slice(0, 7) || "local"}`;
const snapshot = await buildSnapshot(createContext(), version);

const fileContents = `import type { ContractSnapshot } from "../types.js";

export const currentSnapshot: ContractSnapshot = ${JSON.stringify(snapshot, null, 2)} as ContractSnapshot;
`;

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, `${fileContents}\n`, "utf8");

console.log(outputFile);
