export type JsonRecord = Record<string, unknown>;

export type EndpointSummary = {
  name: string;
  group: string | null;
  method: string;
  path: string;
  url: string;
  auth: string;
  file: string;
};

export type EndpointContract = EndpointSummary & {
  bodyType: string | null;
  bodyExample: unknown;
  assertions: unknown[];
  runtimeScripts: Array<{ type: string; code: string }>;
  environmentVariables: string[];
  sourceFiles: string[];
  requestDtoNames: string[];
  requestFields: string[];
  responseDtoNames: string[];
  responseFields: string[];
  requestModelId: string | null;
  responseModelId: string | null;
  interactionHints: string[];
};

export type EndpointInteraction = {
  endpoint: EndpointSummary;
  requestModelId: string | null;
  responseModelId: string | null;
  auth: {
    strategy: string;
    tokenVariables: string[];
    notes: string[];
  };
  transport: {
    bodyType: string | null;
    environmentVariables: string[];
  };
  request: {
    fields: string[];
    example: unknown;
  };
  response: {
    fields: string[];
    dtoNames: string[];
  };
  runtimeBehavior: {
    assertions: unknown[];
    scripts: Array<{ type: string; code: string }>;
  };
  clientSteps: string[];
  notes: string[];
};

export type EnvironmentSummary = {
  name: string;
  file: string;
  variables: Array<{ name: string; value: string }>;
};

export type ModelSummary = {
  id: string;
  name: string;
  kind: "request" | "response";
  endpointKey: string;
  method: string;
  path: string;
  source: "bruno";
  fieldCount: number;
};

export type ModelContract = ModelSummary & {
  dtoNames: string[];
  fields: string[];
  example: unknown;
  brunoFile: string;
  sourceFiles: string[];
  notes: string[];
};

export type AuthProfile = {
  collectionAuth: string;
  folderAuth: Array<{ group: string; auth: string }>;
  authSourceFiles: string[];
  payloadSecurityFiles: string[];
};

export type DriftReport = {
  endpoint: EndpointSummary;
  matchedFiles: string[];
  requestDtoMatches: string[];
  responseDtoMatches: string[];
  authMatches: string[];
  status: "aligned" | "review" | "drift";
  notes: string[];
};

export type ContractSnapshot = {
  snapshotVersion: string;
  generatedAt: string;
  repoRoot: string;
  brunoRoot: string;
  endpointCount: number;
  endpoints: EndpointContract[];
  modelCount: number;
  models: ModelContract[];
  environments: EnvironmentSummary[];
  authProfile: AuthProfile;
};

export type ContractDiff = {
  fromVersion: string;
  toVersion: string;
  added: EndpointSummary[];
  removed: EndpointSummary[];
  changed: Array<{
    key: string;
    before: EndpointContract;
    after: EndpointContract;
    changedFields: string[];
  }>;
};
