import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type {
  AuthProfile,
  ContractSnapshot,
  DriftReport,
  EndpointContract,
  EndpointInteraction,
  EndpointSummary,
  EnvironmentSummary,
  JsonRecord,
  ModelContract,
  ModelSummary
} from "./types.js";

export type ContractContext = {
  repoRoot: string;
  brunoRoot: string;
};

export function createContext(): ContractContext {
  const repoRoot = path.resolve(process.env.REPO_ROOT ?? path.join(import.meta.dirname, "../../.."));
  return {
    repoRoot,
    brunoRoot: path.resolve(process.env.BRUNO_ROOT ?? path.join(repoRoot, "bruno"))
  };
}

export async function loadEndpointSummaries(context: ContractContext): Promise<EndpointSummary[]> {
  const contracts = await loadEndpointContracts(context);
  return contracts.map(({ bodyType, bodyExample, assertions, runtimeScripts, environmentVariables, sourceFiles, requestDtoNames, requestFields, responseDtoNames, responseFields, requestModelId, responseModelId, interactionHints, ...summary }) => summary);
}

export async function loadEndpointContracts(context: ContractContext): Promise<EndpointContract[]> {
  const requestFiles = await listBrunoRequestFiles(context.brunoRoot);
  const collection = await readYamlFile(path.join(context.brunoRoot, "opencollection.yml"));
  const collectionAuth = readAuthLabel(collection?.request?.auth);

  const contracts = await Promise.all(requestFiles.map(async (file) => {
    const parsed = await readYamlFile(file);
    const relative = relativeToRepo(context, file);
    const group = inferGroupFromFile(context, file);
    const method = String(parsed?.http?.method ?? "").toUpperCase();
    const url = String(parsed?.http?.url ?? "");
    const normalizedPath = normalizePathFromUrl(url);
    const folderAuth = await readFolderAuthForFile(file);
    const auth = readAuthLabel(parsed?.http?.auth) ?? folderAuth ?? collectionAuth ?? "none";
    const bodyType = parsed?.http?.body?.type ? String(parsed.http.body.type) : null;
    const bodyExample = parseJsonIfPossible(parsed?.http?.body?.data);
    const runtimeScripts = extractRuntimeScripts(parsed?.runtime?.scripts);
    const assertions = Array.isArray(parsed?.runtime?.assertions) ? parsed.runtime.assertions : [];
    const environmentVariables = extractTemplateVariables(JSON.stringify(parsed));
    const requestFields = isRecord(bodyExample) ? Object.keys(bodyExample).sort() : [];
    const responseFields: string[] = [];
    const requestModelId = requestFields.length > 0 || method !== "GET" ? modelKey(method, normalizedPath, "request") : null;
    const responseModelId = null;

    return {
      name: String(parsed?.info?.name ?? path.basename(file, ".yml")),
      group,
      method,
      path: normalizedPath,
      url,
      auth,
      file: relative,
      bodyType,
      bodyExample,
      assertions,
      runtimeScripts,
      environmentVariables,
      sourceFiles: [],
      requestDtoNames: [],
      requestFields,
      responseDtoNames: [],
      responseFields,
      requestModelId,
      responseModelId,
      interactionHints: buildInteractionHints({ method, auth, bodyExample, runtimeScripts, assertions, responseFields })
    };
  }));

  return contracts.sort((left, right) => contractKey(left).localeCompare(contractKey(right)));
}

export async function findEndpointContract(
  context: ContractContext,
  input: { endpointPath?: string; name?: string; method?: string }
): Promise<EndpointContract> {
  const contracts = await loadEndpointContracts(context);
  const normalizedPath = input.endpointPath?.replace(/^\/+/, "").replace(/\/+$/, "");
  const matches = contracts.filter((contract) => {
    const matchesPath = !normalizedPath || contract.path === normalizedPath;
    const matchesName = !input.name || contract.name === input.name;
    const matchesMethod = !input.method || contract.method === input.method.toUpperCase();
    return matchesPath && matchesName && matchesMethod;
  });

  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length === 0) {
    throw new Error("No endpoint contract matched the provided filters.");
  }
  throw new Error(`Multiple endpoint contracts matched the provided filters: ${matches.map((item) => `${item.method} ${item.path}`).join(", ")}`);
}

export async function loadEnvironments(context: ContractContext): Promise<EnvironmentSummary[]> {
  const envRoot = path.join(context.brunoRoot, "environments");
  const files = (await walk(envRoot)).filter((file) => file.endsWith(".yml"));
  const environments = await Promise.all(files.map(async (file) => {
    const parsed = await readYamlFile(file);
    const variables = Array.isArray(parsed?.variables)
      ? parsed.variables.map((item: any) => ({
        name: String(item?.name ?? ""),
        value: String(item?.value ?? "")
      }))
      : [];
    return {
      name: String(parsed?.name ?? path.basename(file, ".yml")),
      file: relativeToRepo(context, file),
      variables
    };
  }));
  return environments.sort((left, right) => left.name.localeCompare(right.name));
}

export async function loadModelSummaries(context: ContractContext): Promise<ModelSummary[]> {
  const models = await loadModels(context);
  return models.map(({ dtoNames, fields, example, brunoFile, sourceFiles, notes, ...summary }) => summary);
}

export async function loadModels(context: ContractContext): Promise<ModelContract[]> {
  const endpoints = await loadEndpointContracts(context);
  const models = endpoints.flatMap((endpoint) => {
    const requestModel = toRequestModel(endpoint);
    const responseModel = toResponseModel(endpoint);
    return [requestModel, responseModel].filter(Boolean) as ModelContract[];
  });
  return models.sort((left, right) => left.id.localeCompare(right.id));
}

export async function findModel(
  context: ContractContext,
  input: { id?: string; name?: string; kind?: "request" | "response"; endpointPath?: string; method?: string }
): Promise<ModelContract> {
  const models = await loadModels(context);
  const normalizedPath = input.endpointPath?.replace(/^\/+/, "").replace(/\/+$/, "");
  const matches = models.filter((model) => {
    const matchesId = !input.id || model.id === input.id;
    const matchesName = !input.name || model.name === input.name;
    const matchesKind = !input.kind || model.kind === input.kind;
    const matchesPath = !normalizedPath || model.path === normalizedPath;
    const matchesMethod = !input.method || model.method === input.method.toUpperCase();
    return matchesId && matchesName && matchesKind && matchesPath && matchesMethod;
  });

  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length === 0) {
    throw new Error("No model matched the provided filters.");
  }
  throw new Error(`Multiple models matched the provided filters: ${matches.map((item) => item.id).join(", ")}`);
}

export async function getEndpointInteraction(
  context: ContractContext,
  input: { endpointPath?: string; name?: string; method?: string }
): Promise<EndpointInteraction> {
  const endpoint = await findEndpointContract(context, input);
  return buildEndpointInteraction(endpoint);
}

export async function loadAuthProfile(context: ContractContext): Promise<AuthProfile> {
  const collection = await readYamlFile(path.join(context.brunoRoot, "opencollection.yml"));
  const requestFiles = await listBrunoRequestFiles(context.brunoRoot);
  const groups = [...new Set(requestFiles.map((file) => inferGroupFromFile(context, file)).filter(Boolean) as string[])].sort();

  const folderAuth = await Promise.all(groups.map(async (group) => {
    const folderFile = path.join(context.brunoRoot, group, "folder.yml");
    try {
      const parsed = await readYamlFile(folderFile);
      return { group, auth: readAuthLabel(parsed?.request?.auth) ?? "none" };
    } catch {
      return { group, auth: "none" };
    }
  }));

  return {
    collectionAuth: readAuthLabel(collection?.request?.auth) ?? "none",
    folderAuth,
    authSourceFiles: [],
    payloadSecurityFiles: []
  };
}

export async function searchContract(
  context: ContractContext,
  query: string,
  limit: number
): Promise<Array<{ file: string; line: number; text: string }>> {
  const allowedFiles = new Set<string>();
  for (const file of await walk(context.brunoRoot)) {
    allowedFiles.add(file);
  }

  const lowerQuery = query.toLowerCase();
  const matches: Array<{ file: string; line: number; text: string }> = [];

  for (const file of [...allowedFiles].sort()) {
    const content = await fs.readFile(file, "utf8");
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].toLowerCase().includes(lowerQuery)) {
        matches.push({ file: relativeToRepo(context, file), line: index + 1, text: lines[index].trim() });
        if (matches.length >= limit) {
          return matches;
        }
      }
    }
  }

  return matches;
}

export async function analyzeDrift(_context: ContractContext, contract: EndpointContract): Promise<DriftReport> {
  const notes: string[] = [];
  if (contract.method !== "GET" && !isRecord(contract.bodyExample)) {
    notes.push("Bruno does not include a structured request example for this non-GET endpoint.");
  }
  if (contract.assertions.length === 0) {
    notes.push("Bruno request has no assertions.");
  }
  if (contract.runtimeScripts.length === 0) {
    notes.push("Bruno request has no runtime scripts.");
  }
  if (contract.responseModelId === null) {
    notes.push("Bruno does not explicitly document a response model for this endpoint.");
  }

  return {
    endpoint: {
      name: contract.name,
      group: contract.group,
      method: contract.method,
      path: contract.path,
      url: contract.url,
      auth: contract.auth,
      file: contract.file
    },
    matchedFiles: [],
    requestDtoMatches: [],
    responseDtoMatches: [],
    authMatches: [],
    status: notes.length > 0 ? "review" : "aligned",
    notes
  };
}

export async function buildSnapshot(context: ContractContext, snapshotVersion: string): Promise<ContractSnapshot> {
  const endpoints = await loadEndpointContracts(context);
  const models = buildModelsFromEndpoints(endpoints);
  const environments = await loadEnvironments(context);
  const authProfile = await loadAuthProfile(context);
  return {
    snapshotVersion,
    generatedAt: new Date().toISOString(),
    repoRoot: context.repoRoot,
    brunoRoot: context.brunoRoot,
    endpointCount: endpoints.length,
    endpoints,
    modelCount: models.length,
    models,
    environments,
    authProfile
  };
}

export function renderEndpointListMarkdown(output: { total: number; count: number; offset: number; endpoints: EndpointSummary[]; has_more: boolean; next_offset: number | null }): string {
  const lines = ["# CoffeeShop endpoints", "", `Showing ${output.count} of ${output.total} endpoints from offset ${output.offset}.`];
  for (const endpoint of output.endpoints) {
    lines.push(`- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.name} (${endpoint.file})`);
  }
  if (output.has_more && output.next_offset !== null) {
    lines.push("", `More results available. Use offset=${output.next_offset}.`);
  }
  return lines.join("\n");
}

export function renderEndpointContractMarkdown(contract: EndpointContract): string {
  const lines = [
    `# ${contract.method} ${contract.path}`,
    "",
    `- Name: ${contract.name}`,
    `- Group: ${contract.group ?? "none"}`,
    `- Auth: ${contract.auth}`,
    `- Bruno file: ${contract.file}`,
    `- URL template: ${contract.url}`
  ];
  if (contract.environmentVariables.length > 0) {
    lines.push(`- Variables: ${contract.environmentVariables.join(", ")}`);
  }
  if (contract.requestModelId) {
    lines.push(`- Request model ID: ${contract.requestModelId}`);
  }
  if (contract.responseModelId) {
    lines.push(`- Response model ID: ${contract.responseModelId}`);
  }
  if (contract.bodyType) {
    lines.push("", "## Request body", "", `Type: ${contract.bodyType}`, "```json", JSON.stringify(contract.bodyExample, null, 2), "```");
  }
  if (contract.requestFields.length > 0) {
    lines.push("", "## Request fields", "", ...contract.requestFields.map((field) => `- ${field}`));
  }
  if (contract.responseFields.length > 0) {
    lines.push("", "## Response fields", "", ...contract.responseFields.map((field) => `- ${field}`));
  }
  if (contract.assertions.length > 0) {
    lines.push("", "## Assertions", "", "```json", JSON.stringify(contract.assertions, null, 2), "```");
  }
  if (contract.runtimeScripts.length > 0) {
    lines.push("", "## Runtime scripts");
    for (const script of contract.runtimeScripts) {
      lines.push("", `### ${script.type}`, "", "```javascript", script.code, "```");
    }
  }
  if (contract.interactionHints.length > 0) {
    lines.push("", "## Interaction hints", "", ...contract.interactionHints.map((hint) => `- ${hint}`));
  }
  return lines.join("\n");
}

export function renderEndpointInteractionMarkdown(interaction: EndpointInteraction): string {
  const lines = [
    `# Interaction guide: ${interaction.endpoint.method} ${interaction.endpoint.path}`,
    "",
    `- Endpoint name: ${interaction.endpoint.name}`,
    `- Bruno file: ${interaction.endpoint.file}`,
    `- Auth strategy: ${interaction.auth.strategy}`
  ];
  if (interaction.requestModelId) {
    lines.push(`- Request model: ${interaction.requestModelId}`);
  }
  if (interaction.responseModelId) {
    lines.push(`- Response model: ${interaction.responseModelId}`);
  }
  lines.push("", "## Client steps", "", ...interaction.clientSteps.map((step) => `- ${step}`));
  if (interaction.transport.environmentVariables.length > 0) {
    lines.push("", "## Environment variables", "", ...interaction.transport.environmentVariables.map((item) => `- ${item}`));
  }
  if (interaction.request.fields.length > 0) {
    lines.push("", "## Request fields", "", ...interaction.request.fields.map((field) => `- ${field}`));
  }
  if (interaction.request.example !== null && interaction.request.example !== undefined) {
    lines.push("", "## Request example", "", "```json", JSON.stringify(interaction.request.example, null, 2), "```");
  }
  if (interaction.response.fields.length > 0) {
    lines.push("", "## Response fields", "", ...interaction.response.fields.map((field) => `- ${field}`));
  }
  if (interaction.runtimeBehavior.assertions.length > 0) {
    lines.push("", "## Assertions", "", "```json", JSON.stringify(interaction.runtimeBehavior.assertions, null, 2), "```");
  }
  if (interaction.runtimeBehavior.scripts.length > 0) {
    lines.push("", "## Runtime scripts");
    for (const script of interaction.runtimeBehavior.scripts) {
      lines.push("", `### ${script.type}`, "", "```javascript", script.code, "```");
    }
  }
  if (interaction.notes.length > 0) {
    lines.push("", "## Notes", "", ...interaction.notes.map((note) => `- ${note}`));
  }
  return lines.join("\n");
}

export function renderSearchMarkdown(query: string, matches: Array<{ file: string; line: number; text: string }>): string {
  const lines = [`# Search results for '${query}'`, ""];
  if (matches.length === 0) {
    lines.push("No matches found.");
    return lines.join("\n");
  }
  for (const match of matches) {
    lines.push(`- ${match.file}:${match.line} - ${match.text}`);
  }
  return lines.join("\n");
}

export function renderModelListMarkdown(output: { total: number; count: number; offset: number; models: ModelSummary[]; has_more: boolean; next_offset: number | null }): string {
  const lines = ["# CoffeeShop models", "", `Showing ${output.count} of ${output.total} models from offset ${output.offset}.`];
  for (const model of output.models) {
    lines.push(`- \`${model.id}\` - ${model.kind} (${model.fieldCount} fields, ${model.source})`);
  }
  if (output.has_more && output.next_offset !== null) {
    lines.push("", `More results available. Use offset=${output.next_offset}.`);
  }
  return lines.join("\n");
}

export function renderModelMarkdown(model: ModelContract): string {
  const lines = [
    `# ${model.name}`,
    "",
    `- ID: ${model.id}`,
    `- Kind: ${model.kind}`,
    `- Endpoint: ${model.method} ${model.path}`,
    `- Source: ${model.source}`,
    `- Bruno file: ${model.brunoFile}`
  ];
  if (model.fields.length > 0) {
    lines.push("", "## Fields", "", ...model.fields.map((field) => `- ${field}`));
  }
  if (model.example !== null && model.example !== undefined) {
    lines.push("", "## Example", "", "```json", JSON.stringify(model.example, null, 2), "```");
  }
  if (model.notes.length > 0) {
    lines.push("", "## Notes", "", ...model.notes.map((note) => `- ${note}`));
  }
  return lines.join("\n");
}

export function renderEnvironmentListMarkdown(environments: EnvironmentSummary[]): string {
  const lines = ["# Bruno environments", ""];
  for (const environment of environments) {
    lines.push(`- ${environment.name} (${environment.file}) - variables: ${environment.variables.map((item) => item.name).join(", ")}`);
  }
  return lines.join("\n");
}

export function renderEnvironmentMarkdown(environment: EnvironmentSummary): string {
  const lines = [`# Environment: ${environment.name}`, "", `- File: ${environment.file}`, "", "## Variables"];
  for (const variable of environment.variables) {
    lines.push(`- ${variable.name}: ${variable.value}`);
  }
  return lines.join("\n");
}

export function renderAuthProfileMarkdown(profile: AuthProfile): string {
  const lines = ["# Auth profile", "", `- Collection auth: ${profile.collectionAuth}`, "", "## Folder auth"];
  for (const folder of profile.folderAuth) {
    lines.push(`- ${folder.group}: ${folder.auth}`);
  }
  return lines.join("\n");
}

export function renderDriftMarkdown(reports: DriftReport[]): string {
  const lines = ["# Bruno contract completeness analysis", ""];
  for (const report of reports) {
    lines.push(`## ${report.endpoint.method} ${report.endpoint.path}`);
    lines.push(`- Status: ${report.status}`);
    lines.push(`- Bruno file: ${report.endpoint.file}`);
    for (const note of report.notes) {
      lines.push(`- Note: ${note}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function formatResult(data: unknown, responseFormat: "markdown" | "json", markdown: string) {
  return {
    content: [{ type: "text" as const, text: responseFormat === "json" ? JSON.stringify(data, null, 2) : markdown }],
    structuredContent: data
  };
}

export function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Error: ${message}` }]
  };
}

function contractKey(endpoint: Pick<EndpointSummary, "method" | "path">): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function modelKey(method: string, endpointPath: string, kind: "request" | "response"): string {
  return `${method}_${endpointPath.replace(/[^\w]+/g, "_")}_${kind}`.replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function toSummary(endpoint: EndpointContract): EndpointSummary {
  return {
    name: endpoint.name,
    group: endpoint.group,
    method: endpoint.method,
    path: endpoint.path,
    url: endpoint.url,
    auth: endpoint.auth,
    file: endpoint.file
  };
}

function buildModelsFromEndpoints(endpoints: EndpointContract[]): ModelContract[] {
  return endpoints.flatMap((endpoint) => [toRequestModel(endpoint), toResponseModel(endpoint)].filter(Boolean) as ModelContract[]).sort((a, b) => a.id.localeCompare(b.id));
}

async function listBrunoRequestFiles(root: string): Promise<string[]> {
  const files = await walk(root);
  return files.filter((file) => {
    if (!file.endsWith(".yml")) return false;
    if (file.includes(`${path.sep}environments${path.sep}`)) return false;
    const base = path.basename(file);
    return base !== "opencollection.yml" && base !== "folder.yml";
  });
}

async function walk(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  }));
  return files.flat();
}

async function readYamlFile(file: string): Promise<any> {
  const text = await fs.readFile(file, "utf8");
  return YAML.parse(text);
}

async function readFolderAuthForFile(file: string): Promise<string | null> {
  const folderFile = path.join(path.dirname(file), "folder.yml");
  try {
    const parsed = await readYamlFile(folderFile);
    return readAuthLabel(parsed?.request?.auth);
  } catch {
    return null;
  }
}

function readAuthLabel(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === "string") return input;
  if (typeof input === "object") {
    const value = input as JsonRecord;
    if (typeof value.type === "string") return value.type;
  }
  return "configured";
}

function inferGroupFromFile(context: ContractContext, file: string): string | null {
  const relative = path.relative(context.brunoRoot, file);
  const segments = relative.split(path.sep);
  return segments.length > 1 ? segments[0] : null;
}

function normalizePathFromUrl(url: string): string {
  return url.replace(/\{\{base_url\}\}/g, "").replace(/^\/+/, "").replace(/\/+$/, "");
}

function parseJsonIfPossible(input: unknown): unknown {
  if (typeof input !== "string") return input ?? null;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function extractRuntimeScripts(input: unknown): Array<{ type: string; code: string }> {
  if (!Array.isArray(input)) return [];
  return input.map((item) => {
    const value = item as JsonRecord;
    return {
      type: typeof value.type === "string" ? value.type : "unknown",
      code: typeof value.code === "string" ? value.code : ""
    };
  });
}

function extractTemplateVariables(text: string): string[] {
  const matches = [...text.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1]);
  return [...new Set(matches)].sort();
}

function toRequestModel(endpoint: EndpointContract): ModelContract | null {
  if (!endpoint.requestModelId) return null;
  return {
    id: endpoint.requestModelId,
    name: `${endpoint.method} ${endpoint.path} request`,
    kind: "request",
    endpointKey: contractKey(endpoint),
    method: endpoint.method,
    path: endpoint.path,
    source: "bruno",
    fieldCount: endpoint.requestFields.length,
    dtoNames: [],
    fields: endpoint.requestFields,
    example: endpoint.bodyExample,
    brunoFile: endpoint.file,
    sourceFiles: [],
    notes: endpoint.requestFields.length === 0 ? ["Bruno does not include explicit request fields for this endpoint."] : []
  };
}

function toResponseModel(endpoint: EndpointContract): ModelContract | null {
  if (!endpoint.responseModelId) return null;
  return {
    id: endpoint.responseModelId,
    name: `${endpoint.method} ${endpoint.path} response`,
    kind: "response",
    endpointKey: contractKey(endpoint),
    method: endpoint.method,
    path: endpoint.path,
    source: "bruno",
    fieldCount: endpoint.responseFields.length,
    dtoNames: [],
    fields: endpoint.responseFields,
    example: null,
    brunoFile: endpoint.file,
    sourceFiles: [],
    notes: ["Response model is documented directly in Bruno."]
  };
}

function buildEndpointInteraction(endpoint: EndpointContract): EndpointInteraction {
  const tokenVariables = endpoint.environmentVariables.filter((item) => item.toLowerCase().includes("token"));
  const authNotes = endpoint.auth === "inherit" ? ["Auth is inherited from Bruno collection or folder defaults."] : [];
  const clientSteps = [`Send a ${endpoint.method} request to ${endpoint.path}.`];
  if (endpoint.environmentVariables.includes("base_url")) clientSteps.push("Resolve the final URL using the configured base URL.");
  if (endpoint.auth !== "none") clientSteps.push(`Apply the configured auth strategy: ${endpoint.auth}.`);
  if (endpoint.requestFields.length > 0) clientSteps.push(`Build the request with fields: ${endpoint.requestFields.join(", ")}.`);
  if (endpoint.bodyType) clientSteps.push(`Encode the request body as ${endpoint.bodyType}.`);
  if (endpoint.assertions.length > 0) clientSteps.push("Treat Bruno assertions as the expected success behavior for the call.");
  if (endpoint.runtimeScripts.length > 0) clientSteps.push("Honor Bruno runtime scripts because they encode post-request workflow behavior.");
  if (endpoint.responseFields.length > 0) clientSteps.push(`Map the response fields: ${endpoint.responseFields.join(", ")}.`);

  return {
    endpoint: toSummary(endpoint),
    requestModelId: endpoint.requestModelId,
    responseModelId: endpoint.responseModelId,
    auth: { strategy: endpoint.auth, tokenVariables, notes: authNotes },
    transport: { bodyType: endpoint.bodyType, environmentVariables: endpoint.environmentVariables },
    request: { fields: endpoint.requestFields, example: endpoint.bodyExample },
    response: { fields: endpoint.responseFields, dtoNames: [] },
    runtimeBehavior: { assertions: endpoint.assertions, scripts: endpoint.runtimeScripts },
    clientSteps,
    notes: endpoint.interactionHints
  };
}

function buildInteractionHints(input: {
  method: string;
  auth: string;
  bodyExample: unknown;
  runtimeScripts: Array<{ type: string; code: string }>;
  assertions: unknown[];
  responseFields: string[];
}): string[] {
  const hints: string[] = [];
  if (input.auth !== "none") hints.push(`This endpoint uses auth strategy '${input.auth}'.`);
  if (input.method !== "GET" && isRecord(input.bodyExample)) hints.push("Bruno provides a structured request example for this endpoint.");
  if (input.runtimeScripts.length > 0) hints.push("Bruno runtime scripts encode post-request behavior.");
  if (input.assertions.length > 0) hints.push("Bruno assertions define expected success behavior.");
  if (input.responseFields.length === 0) hints.push("Bruno does not explicitly document a response model for this endpoint.");
  return hints;
}

function relativeToRepo(context: ContractContext, file: string): string {
  return path.relative(context.repoRoot, file) || ".";
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
