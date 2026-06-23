import type {
  ContractDiff,
  ContractSnapshot,
  DriftReport,
  EndpointContract,
  EndpointInteraction,
  EndpointSummary,
  EnvironmentSummary,
  ModelContract,
  ModelSummary
} from "./types.js";

type ResponseFormat = "markdown" | "json";

type ToolResponse = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: unknown;
  isError?: boolean;
};

export type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Record<string, boolean>;
};

export function listWorkerTools(): ToolDefinition[] {
  return [
    {
      name: "coffeeshop_list_endpoints",
      title: "List CoffeeShop Endpoints",
      description: "List endpoints discovered from Bruno with optional filters by group, method, or query text.",
      inputSchema: paginationSchema({
        group: optionalStringSchema("Filter by top-level Bruno group."),
        method: optionalStringSchema("Filter by HTTP method."),
        query: optionalStringSchema("Free-text filter over names, paths, groups, and source files.")
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_get_endpoint_contract",
      title: "Get CoffeeShop Endpoint Contract",
      description: "Return the detailed contract for one endpoint, including auth, payload example, fields, assertions, and runtime scripts documented in Bruno.",
      inputSchema: responseSchema({
        path: optionalStringSchema("Endpoint path without the base URL."),
        name: optionalStringSchema("Bruno request name."),
        method: optionalStringSchema("HTTP method.")
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_get_endpoint_interaction",
      title: "Get CoffeeShop Endpoint Interaction Guide",
      description: "Return how a client agent should interact with one endpoint: auth, request model, response model, runtime behavior, and client steps.",
      inputSchema: responseSchema({
        path: optionalStringSchema("Endpoint path without the base URL."),
        name: optionalStringSchema("Bruno request name."),
        method: optionalStringSchema("HTTP method.")
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_search_contract",
      title: "Search CoffeeShop Contract",
      description: "Search the published Bruno-derived contract for endpoints, models, auth markers, environment variables, and field names.",
      inputSchema: responseSchema({
        query: { type: "string", minLength: 2, description: "Search query." },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20, description: "Maximum matches to return." }
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_list_models",
      title: "List CoffeeShop Models",
      description: "List normalized request and response models documented in Bruno.",
      inputSchema: paginationSchema({
        kind: {
          type: "string",
          enum: ["request", "response"],
          description: "Filter by model kind."
        },
        method: optionalStringSchema("Filter by HTTP method."),
        path: optionalStringSchema("Filter by endpoint path."),
        query: optionalStringSchema("Free-text filter over IDs, names, paths, and model kinds.")
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_get_model",
      title: "Get CoffeeShop Model",
      description: "Return one request or response model with fields, example payload if available, and Bruno provenance.",
      inputSchema: responseSchema({
        id: optionalStringSchema("Model ID."),
        name: optionalStringSchema("Model name."),
        kind: {
          type: "string",
          enum: ["request", "response"],
          description: "Model kind."
        },
        path: optionalStringSchema("Endpoint path."),
        method: optionalStringSchema("HTTP method.")
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_list_environments",
      title: "List Bruno Environments",
      description: "List Bruno environments and the variables they define.",
      inputSchema: responseSchema({}),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_get_environment",
      title: "Get Bruno Environment",
      description: "Return one Bruno environment and all variables declared in it.",
      inputSchema: responseSchema({
        name: { type: "string", description: "Environment name." }
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_get_auth_profile",
      title: "Get CoffeeShop Auth Profile",
      description: "Return auth defaults discovered from Bruno collection and folders.",
      inputSchema: responseSchema({}),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_analyze_contract_drift",
      title: "Analyze Bruno Contract Completeness",
      description: "Inspect the published Bruno contract for endpoints that still lack structured request examples, assertions, scripts, or response models.",
      inputSchema: responseSchema({
        path: optionalStringSchema("Filter to one endpoint path."),
        method: optionalStringSchema("Filter to one HTTP method.")
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_list_contract_versions",
      title: "List Contract Versions",
      description: "List contract snapshots published from Bruno changes.",
      inputSchema: responseSchema({}),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_diff_contract_versions",
      title: "Diff Contract Versions",
      description: "Compare two published Bruno-derived contract snapshots and report added, removed, or changed endpoints.",
      inputSchema: responseSchema({
        from_version: { type: "string", description: "Older snapshot version." },
        to_version: { type: "string", description: "Newer snapshot version." }
      }),
      annotations: readOnlyAnnotations()
    },
    {
      name: "coffeeshop_get_current_contract_snapshot",
      title: "Get Current Contract Snapshot",
      description: "Return the full currently published contract snapshot derived from Bruno.",
      inputSchema: responseSchema({
        snapshot_version: {
          type: "string",
          default: "current",
          description: "Use 'current' or a concrete published version."
        }
      }),
      annotations: readOnlyAnnotations()
    }
  ];
}

export function callWorkerTool(
  name: string,
  args: Record<string, unknown>,
  currentSnapshot: ContractSnapshot,
  snapshotIndex: Record<string, ContractSnapshot>
): ToolResponse {
  const responseFormat = readResponseFormat(args);

  try {
    switch (name) {
      case "coffeeshop_list_endpoints":
        return listEndpoints(args, currentSnapshot, responseFormat);
      case "coffeeshop_get_endpoint_contract":
        return getEndpointContract(args, currentSnapshot, responseFormat);
      case "coffeeshop_get_endpoint_interaction":
        return getEndpointInteraction(args, currentSnapshot, responseFormat);
      case "coffeeshop_search_contract":
        return searchContract(args, currentSnapshot, responseFormat);
      case "coffeeshop_list_models":
        return listModels(args, currentSnapshot, responseFormat);
      case "coffeeshop_get_model":
        return getModel(args, currentSnapshot, responseFormat);
      case "coffeeshop_list_environments":
        return formatResult(currentSnapshot.environments, responseFormat, renderEnvironmentListMarkdown(currentSnapshot.environments));
      case "coffeeshop_get_environment":
        return getEnvironment(args, currentSnapshot, responseFormat);
      case "coffeeshop_get_auth_profile":
        return formatResult(currentSnapshot.authProfile, responseFormat, renderAuthProfileMarkdown(currentSnapshot));
      case "coffeeshop_analyze_contract_drift":
        return analyzeContract(args, currentSnapshot, responseFormat);
      case "coffeeshop_list_contract_versions":
        return listVersions(snapshotIndex, responseFormat);
      case "coffeeshop_diff_contract_versions":
        return diffVersions(args, snapshotIndex, responseFormat);
      case "coffeeshop_get_current_contract_snapshot":
        return getSnapshot(args, currentSnapshot, snapshotIndex, responseFormat);
      default:
        return errorResult(`Unknown tool '${name}'.`);
    }
  } catch (error) {
    return errorResult(asMessage(error));
  }
}

function listEndpoints(args: Record<string, unknown>, snapshot: ContractSnapshot, responseFormat: ResponseFormat): ToolResponse {
  const group = readOptionalString(args.group);
  const method = readOptionalString(args.method)?.toUpperCase();
  const query = readOptionalString(args.query)?.toLowerCase();
  const limit = readInteger(args.limit, 20, 1, 100);
  const offset = readInteger(args.offset, 0, 0, Number.MAX_SAFE_INTEGER);

  const filtered = snapshot.endpoints.filter((endpoint) => {
    const matchesGroup = !group || endpoint.group === group;
    const matchesMethod = !method || endpoint.method === method;
    const matchesQuery = !query || [endpoint.name, endpoint.path, endpoint.file, endpoint.group ?? ""].some((value) => value.toLowerCase().includes(query));
    return matchesGroup && matchesMethod && matchesQuery;
  });

  const items = filtered.slice(offset, offset + limit);
  const output = {
    total: filtered.length,
    count: items.length,
    offset,
    endpoints: items,
    has_more: offset + items.length < filtered.length,
    next_offset: offset + items.length < filtered.length ? offset + items.length : null
  };

  return formatResult(output, responseFormat, renderEndpointListMarkdown(output));
}

function getEndpointContract(args: Record<string, unknown>, snapshot: ContractSnapshot, responseFormat: ResponseFormat): ToolResponse {
  const contract = findEndpoint(snapshot, {
    endpointPath: readOptionalString(args.path),
    name: readOptionalString(args.name),
    method: readOptionalString(args.method)
  });
  return formatResult(contract, responseFormat, renderEndpointContractMarkdown(contract));
}

function getEndpointInteraction(args: Record<string, unknown>, snapshot: ContractSnapshot, responseFormat: ResponseFormat): ToolResponse {
  const endpoint = findEndpoint(snapshot, {
    endpointPath: readOptionalString(args.path),
    name: readOptionalString(args.name),
    method: readOptionalString(args.method)
  });
  const interaction = buildEndpointInteraction(endpoint);
  return formatResult(interaction, responseFormat, renderEndpointInteractionMarkdown(interaction));
}

function searchContract(args: Record<string, unknown>, snapshot: ContractSnapshot, responseFormat: ResponseFormat): ToolResponse {
  const query = readRequiredString(args.query, "query").toLowerCase();
  const limit = readInteger(args.limit, 20, 1, 100);
  const results: Array<{ type: string; id: string; summary: string }> = [];

  for (const endpoint of snapshot.endpoints) {
    const haystack = JSON.stringify({
      name: endpoint.name,
      path: endpoint.path,
      group: endpoint.group,
      auth: endpoint.auth,
      file: endpoint.file,
      requestFields: endpoint.requestFields,
      responseFields: endpoint.responseFields,
      environmentVariables: endpoint.environmentVariables
    }).toLowerCase();

    if (haystack.includes(query)) {
      results.push({
        type: "endpoint",
        id: `${endpoint.method} ${endpoint.path}`,
        summary: `${endpoint.name} (${endpoint.file})`
      });
    }
    if (results.length >= limit) break;
  }

  if (results.length < limit) {
    for (const model of snapshot.models) {
      const haystack = JSON.stringify({
        id: model.id,
        name: model.name,
        path: model.path,
        kind: model.kind,
        fields: model.fields
      }).toLowerCase();
      if (haystack.includes(query)) {
        results.push({
          type: "model",
          id: model.id,
          summary: `${model.kind} model for ${model.method} ${model.path}`
        });
      }
      if (results.length >= limit) break;
    }
  }

  if (results.length < limit) {
    for (const environment of snapshot.environments) {
      const haystack = JSON.stringify(environment).toLowerCase();
      if (haystack.includes(query)) {
        results.push({
          type: "environment",
          id: environment.name,
          summary: environment.file
        });
      }
      if (results.length >= limit) break;
    }
  }

  return formatResult(results, responseFormat, renderSearchMarkdown(query, results));
}

function listModels(args: Record<string, unknown>, snapshot: ContractSnapshot, responseFormat: ResponseFormat): ToolResponse {
  const kind = readOptionalString(args.kind) as "request" | "response" | undefined;
  const method = readOptionalString(args.method)?.toUpperCase();
  const path = normalizePath(readOptionalString(args.path));
  const query = readOptionalString(args.query)?.toLowerCase();
  const limit = readInteger(args.limit, 20, 1, 100);
  const offset = readInteger(args.offset, 0, 0, Number.MAX_SAFE_INTEGER);

  const filtered = snapshot.models.filter((model) => {
    const matchesKind = !kind || model.kind === kind;
    const matchesMethod = !method || model.method === method;
    const matchesPath = !path || model.path === path;
    const matchesQuery = !query || [model.id, model.name, model.path, model.kind].some((value) => value.toLowerCase().includes(query));
    return matchesKind && matchesMethod && matchesPath && matchesQuery;
  });

  const items = filtered.slice(offset, offset + limit);
  const output = {
    total: filtered.length,
    count: items.length,
    offset,
    models: items,
    has_more: offset + items.length < filtered.length,
    next_offset: offset + items.length < filtered.length ? offset + items.length : null
  };

  return formatResult(output, responseFormat, renderModelListMarkdown(output));
}

function getModel(args: Record<string, unknown>, snapshot: ContractSnapshot, responseFormat: ResponseFormat): ToolResponse {
  const model = findModel(snapshot, {
    id: readOptionalString(args.id),
    name: readOptionalString(args.name),
    kind: readOptionalString(args.kind) as "request" | "response" | undefined,
    endpointPath: readOptionalString(args.path),
    method: readOptionalString(args.method)
  });
  return formatResult(model, responseFormat, renderModelMarkdown(model));
}

function getEnvironment(args: Record<string, unknown>, snapshot: ContractSnapshot, responseFormat: ResponseFormat): ToolResponse {
  const name = readRequiredString(args.name, "name");
  const environment = snapshot.environments.find((item) => item.name === name);
  if (!environment) {
    throw new Error(`Environment '${name}' was not found.`);
  }
  return formatResult(environment, responseFormat, renderEnvironmentMarkdown(environment));
}

function analyzeContract(args: Record<string, unknown>, snapshot: ContractSnapshot, responseFormat: ResponseFormat): ToolResponse {
  const path = normalizePath(readOptionalString(args.path));
  const method = readOptionalString(args.method)?.toUpperCase();
  const reports = snapshot.endpoints
    .filter((endpoint) => (!path || endpoint.path === path) && (!method || endpoint.method === method))
    .map(analyzeEndpoint);
  return formatResult(reports, responseFormat, renderDriftMarkdown(reports));
}

function listVersions(snapshotIndex: Record<string, ContractSnapshot>, responseFormat: ResponseFormat): ToolResponse {
  const versions = Object.keys(snapshotIndex)
    .sort()
    .map((version) => ({ version, file: `snapshots/${version}.json` }));
  return formatResult(versions, responseFormat, renderVersionsMarkdown(versions));
}

function diffVersions(args: Record<string, unknown>, snapshotIndex: Record<string, ContractSnapshot>, responseFormat: ResponseFormat): ToolResponse {
  const fromVersion = readRequiredString(args.from_version, "from_version");
  const toVersion = readRequiredString(args.to_version, "to_version");
  const from = snapshotIndex[fromVersion];
  const to = snapshotIndex[toVersion];

  if (!from) throw new Error(`Unknown snapshot version '${fromVersion}'.`);
  if (!to) throw new Error(`Unknown snapshot version '${toVersion}'.`);

  const diff = diffSnapshots(from, to);
  return formatResult(diff, responseFormat, renderDiffMarkdown(diff));
}

function getSnapshot(
  args: Record<string, unknown>,
  currentSnapshot: ContractSnapshot,
  snapshotIndex: Record<string, ContractSnapshot>,
  responseFormat: ResponseFormat
): ToolResponse {
  const requested = readOptionalString(args.snapshot_version) ?? "current";
  const snapshot = requested === "current"
    ? currentSnapshot
    : requested === "latest"
      ? snapshotIndex.latest ?? currentSnapshot
      : snapshotIndex[requested];

  if (!snapshot) {
    throw new Error(`Unknown snapshot version '${requested}'.`);
  }

  return formatResult(snapshot, responseFormat, `# Contract snapshot\n\n- Version: ${snapshot.snapshotVersion}\n- Generated at: ${snapshot.generatedAt}\n- Endpoints: ${snapshot.endpointCount}`);
}

function findEndpoint(
  snapshot: ContractSnapshot,
  input: { endpointPath?: string; name?: string; method?: string }
): EndpointContract {
  const normalizedPath = normalizePath(input.endpointPath);
  const normalizedMethod = input.method?.toUpperCase();
  const matches = snapshot.endpoints.filter((contract) => {
    const matchesPath = !normalizedPath || contract.path === normalizedPath;
    const matchesName = !input.name || contract.name === input.name;
    const matchesMethod = !normalizedMethod || contract.method === normalizedMethod;
    return matchesPath && matchesName && matchesMethod;
  });

  if (matches.length === 1) return matches[0];
  if (matches.length === 0) throw new Error("No endpoint contract matched the provided filters.");
  throw new Error(`Multiple endpoint contracts matched the provided filters: ${matches.map((item) => `${item.method} ${item.path}`).join(", ")}`);
}

function findModel(
  snapshot: ContractSnapshot,
  input: { id?: string; name?: string; kind?: "request" | "response"; endpointPath?: string; method?: string }
): ModelContract {
  const normalizedPath = normalizePath(input.endpointPath);
  const normalizedMethod = input.method?.toUpperCase();
  const matches = snapshot.models.filter((model) => {
    const matchesId = !input.id || model.id === input.id;
    const matchesName = !input.name || model.name === input.name;
    const matchesKind = !input.kind || model.kind === input.kind;
    const matchesPath = !normalizedPath || model.path === normalizedPath;
    const matchesMethod = !normalizedMethod || model.method === normalizedMethod;
    return matchesId && matchesName && matchesKind && matchesPath && matchesMethod;
  });

  if (matches.length === 1) return matches[0];
  if (matches.length === 0) throw new Error("No model matched the provided filters.");
  throw new Error(`Multiple models matched the provided filters: ${matches.map((item) => item.id).join(", ")}`);
}

function analyzeEndpoint(contract: EndpointContract): DriftReport {
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
    endpoint: toSummary(contract),
    matchedFiles: [],
    requestDtoMatches: [],
    responseDtoMatches: [],
    authMatches: [],
    status: notes.length > 0 ? "review" : "aligned",
    notes
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
    response: { fields: endpoint.responseFields, dtoNames: endpoint.responseDtoNames },
    runtimeBehavior: { assertions: endpoint.assertions, scripts: endpoint.runtimeScripts },
    clientSteps,
    notes: endpoint.interactionHints
  };
}

function diffSnapshots(from: ContractSnapshot, to: ContractSnapshot): ContractDiff {
  const fromIndex = new Map(from.endpoints.map((endpoint) => [contractKey(endpoint), endpoint]));
  const toIndex = new Map(to.endpoints.map((endpoint) => [contractKey(endpoint), endpoint]));
  const added: EndpointSummary[] = [];
  const removed: EndpointSummary[] = [];
  const changed: ContractDiff["changed"] = [];

  for (const [key, endpoint] of toIndex) {
    if (!fromIndex.has(key)) {
      added.push(toSummary(endpoint));
      continue;
    }

    const before = fromIndex.get(key)!;
    const changedFields = listChangedFields(before, endpoint);
    if (changedFields.length > 0) {
      changed.push({ key, before, after: endpoint, changedFields });
    }
  }

  for (const [key, endpoint] of fromIndex) {
    if (!toIndex.has(key)) {
      removed.push(toSummary(endpoint));
    }
  }

  return {
    fromVersion: from.snapshotVersion,
    toVersion: to.snapshotVersion,
    added: added.sort((left, right) => contractKey(left).localeCompare(contractKey(right))),
    removed: removed.sort((left, right) => contractKey(left).localeCompare(contractKey(right))),
    changed: changed.sort((left, right) => left.key.localeCompare(right.key))
  };
}

function formatResult(data: unknown, responseFormat: ResponseFormat, markdown: string): ToolResponse {
  return {
    content: [{ type: "text", text: responseFormat === "json" ? JSON.stringify(data, null, 2) : markdown }],
    structuredContent: data
  };
}

function errorResult(message: string): ToolResponse {
  return {
    isError: true,
    content: [{ type: "text", text: `Error: ${message}` }]
  };
}

function renderEndpointListMarkdown(output: { total: number; count: number; offset: number; endpoints: EndpointSummary[]; has_more: boolean; next_offset: number | null }): string {
  const lines = ["# CoffeeShop endpoints", "", `Showing ${output.count} of ${output.total} endpoints from offset ${output.offset}.`];
  for (const endpoint of output.endpoints) {
    lines.push(`- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.name} (${endpoint.file})`);
  }
  if (output.has_more && output.next_offset !== null) {
    lines.push("", `More results available. Use offset=${output.next_offset}.`);
  }
  return lines.join("\n");
}

function renderEndpointContractMarkdown(contract: EndpointContract): string {
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

function renderEndpointInteractionMarkdown(interaction: EndpointInteraction): string {
  const lines = [
    `# Interaction guide: ${interaction.endpoint.method} ${interaction.endpoint.path}`,
    "",
    `- Endpoint name: ${interaction.endpoint.name}`,
    `- Bruno file: ${interaction.endpoint.file}`,
    `- Auth strategy: ${interaction.auth.strategy}`
  ];
  if (interaction.requestModelId) lines.push(`- Request model: ${interaction.requestModelId}`);
  if (interaction.responseModelId) lines.push(`- Response model: ${interaction.responseModelId}`);
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

function renderSearchMarkdown(query: string, matches: Array<{ type: string; id: string; summary: string }>): string {
  const lines = [`# Search results for '${query}'`, ""];
  if (matches.length === 0) {
    lines.push("No matches found.");
    return lines.join("\n");
  }
  for (const match of matches) {
    lines.push(`- [${match.type}] ${match.id} - ${match.summary}`);
  }
  return lines.join("\n");
}

function renderModelListMarkdown(output: { total: number; count: number; offset: number; models: ModelSummary[]; has_more: boolean; next_offset: number | null }): string {
  const lines = ["# CoffeeShop models", "", `Showing ${output.count} of ${output.total} models from offset ${output.offset}.`];
  for (const model of output.models) {
    lines.push(`- \`${model.id}\` - ${model.kind} (${model.fieldCount} fields, ${model.source})`);
  }
  if (output.has_more && output.next_offset !== null) {
    lines.push("", `More results available. Use offset=${output.next_offset}.`);
  }
  return lines.join("\n");
}

function renderModelMarkdown(model: ModelContract): string {
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

function renderEnvironmentListMarkdown(environments: EnvironmentSummary[]): string {
  const lines = ["# Bruno environments", ""];
  for (const environment of environments) {
    lines.push(`- ${environment.name} (${environment.file}) - variables: ${environment.variables.map((item) => item.name).join(", ")}`);
  }
  return lines.join("\n");
}

function renderEnvironmentMarkdown(environment: EnvironmentSummary): string {
  const lines = [`# Environment: ${environment.name}`, "", `- File: ${environment.file}`, "", "## Variables"];
  for (const variable of environment.variables) {
    lines.push(`- ${variable.name}: ${variable.value}`);
  }
  return lines.join("\n");
}

function renderAuthProfileMarkdown(snapshot: ContractSnapshot): string {
  const lines = ["# Auth profile", "", `- Collection auth: ${snapshot.authProfile.collectionAuth}`, "", "## Folder auth"];
  for (const folder of snapshot.authProfile.folderAuth) {
    lines.push(`- ${folder.group}: ${folder.auth}`);
  }
  return lines.join("\n");
}

function renderDriftMarkdown(reports: DriftReport[]): string {
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

function renderVersionsMarkdown(versions: Array<{ version: string; file: string }>): string {
  const lines = ["# Contract versions", ""];
  if (versions.length === 0) {
    lines.push("No snapshots available.");
    return lines.join("\n");
  }
  for (const version of versions) {
    lines.push(`- ${version.version} (${version.file})`);
  }
  return lines.join("\n");
}

function renderDiffMarkdown(diff: ContractDiff): string {
  const lines = [
    `# Contract diff: ${diff.fromVersion} -> ${diff.toVersion}`,
    "",
    `- Added endpoints: ${diff.added.length}`,
    `- Removed endpoints: ${diff.removed.length}`,
    `- Changed endpoints: ${diff.changed.length}`
  ];
  if (diff.added.length > 0) {
    lines.push("", "## Added");
    for (const endpoint of diff.added) {
      lines.push(`- \`${endpoint.method} ${endpoint.path}\` (${endpoint.file})`);
    }
  }
  if (diff.removed.length > 0) {
    lines.push("", "## Removed");
    for (const endpoint of diff.removed) {
      lines.push(`- \`${endpoint.method} ${endpoint.path}\` (${endpoint.file})`);
    }
  }
  if (diff.changed.length > 0) {
    lines.push("", "## Changed");
    for (const item of diff.changed) {
      lines.push(`- \`${item.after.method} ${item.after.path}\` fields: ${item.changedFields.join(", ")}`);
    }
  }
  return lines.join("\n");
}

function paginationSchema(extraProperties: Record<string, unknown>) {
  return responseSchema({
    ...extraProperties,
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20, description: "Maximum results to return." },
    offset: { type: "integer", minimum: 0, default: 0, description: "Zero-based result offset." }
  });
}

function responseSchema(properties: Record<string, unknown>) {
  return {
    type: "object",
    properties: {
      ...properties,
      response_format: {
        type: "string",
        enum: ["markdown", "json"],
        default: "markdown",
        description: "Preferred response format."
      }
    },
    additionalProperties: false
  };
}

function optionalStringSchema(description: string) {
  return { type: "string", description };
}

function readOnlyAnnotations() {
  return {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  };
}

function readResponseFormat(args: Record<string, unknown>): ResponseFormat {
  return args.response_format === "json" ? "json" : "markdown";
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value === "string" && value.length > 0) return value;
  throw new Error(`'${field}' is required.`);
}

function readInteger(value: unknown, fallback: number, min: number, max: number): number {
  const candidate = typeof value === "number" ? value : fallback;
  if (!Number.isInteger(candidate) || candidate < min || candidate > max) {
    throw new Error(`Expected an integer between ${min} and ${max}.`);
  }
  return candidate;
}

function normalizePath(value?: string): string | undefined {
  return value?.replace(/^\/+/, "").replace(/\/+$/, "");
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

function contractKey(endpoint: Pick<EndpointSummary, "method" | "path">): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function listChangedFields(before: EndpointContract, after: EndpointContract): string[] {
  const candidates: Array<keyof EndpointContract> = [
    "auth",
    "bodyType",
    "bodyExample",
    "assertions",
    "runtimeScripts",
    "environmentVariables",
    "requestFields",
    "responseFields",
    "requestModelId",
    "responseModelId",
    "interactionHints"
  ];
  return candidates.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field])).map(String);
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
