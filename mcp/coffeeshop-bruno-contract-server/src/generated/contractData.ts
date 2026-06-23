import type { ContractSnapshot } from "../types.js";

const emptySnapshot: ContractSnapshot = {
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

export const currentSnapshot = emptySnapshot;
export const snapshotIndex: Record<string, ContractSnapshot> = {
  [emptySnapshot.snapshotVersion]: emptySnapshot
};
