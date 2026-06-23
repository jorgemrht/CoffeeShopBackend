import { buildSnapshot, createContext, writeSnapshot } from "./contract.js";

const version = process.argv[2];

if (!version) {
  console.error("Usage: tsx src/exportSnapshot.ts <snapshot-version>");
  process.exit(1);
}

const context = createContext();
const snapshot = await buildSnapshot(context, version);
const file = await writeSnapshot(context, snapshot);

console.log(file);
