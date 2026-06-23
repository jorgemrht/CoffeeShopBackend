import { promises as fs } from "node:fs";
import path from "node:path";
import type { ContractSnapshot } from "./types.js";

const repoRoot = path.resolve(process.env.REPO_ROOT ?? path.join(import.meta.dirname, "../../.."));
const packageRoot = path.join(repoRoot, "mcp/coffeeshop-bruno-contract-server");
const snapshotRoot = path.join(packageRoot, "snapshots");
const outputFile = path.join(packageRoot, "src/generated/contractData.ts");

const files = await fs.readdir(snapshotRoot).catch(() => []);
const snapshotEntries = await Promise.all(
  files
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map(async (file) => {
      const text = await fs.readFile(path.join(snapshotRoot, file), "utf8");
      return {
        file,
        snapshot: JSON.parse(text) as ContractSnapshot
      };
    })
);

const latestSnapshot = snapshotEntries.find((entry) => entry.file === "latest.json")?.snapshot
  ?? snapshotEntries.find((entry) => entry.file === "current.json")?.snapshot
  ?? snapshotEntries.at(-1)?.snapshot
  ?? {
    snapshotVersion: "unpublished",
    generatedAt: "1970-01-01T00:00:00.000Z",
    repoRoot: "",
    brunoRoot: "",
    endpointCount: 0,
    endpoints: [],
    modelCount: 0,
    models: [],
    environments: [],
    authProfile: {
      collectionAuth: "none",
      folderAuth: [],
      authSourceFiles: [],
      payloadSecurityFiles: []
    }
  };

const snapshotIndex = Object.fromEntries(
  snapshotEntries.map(({ snapshot }) => [snapshot.snapshotVersion, snapshot])
);
snapshotIndex.latest = latestSnapshot;
snapshotIndex.current = latestSnapshot;

const fileContents = `import type { ContractSnapshot } from "../types.js";

export const currentSnapshot: ContractSnapshot = ${JSON.stringify(latestSnapshot, null, 2)} as ContractSnapshot;

export const snapshotIndex: Record<string, ContractSnapshot> = ${JSON.stringify(snapshotIndex, null, 2)} as Record<string, ContractSnapshot>;
`;

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, `${fileContents}\n`, "utf8");

console.log(outputFile);
