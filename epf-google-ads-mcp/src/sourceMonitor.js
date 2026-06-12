import { GOOGLE_ADS_RESOURCES } from "./googleAdsResources.js";
import { workerTools } from "./workerTools.js";

const UPSTREAM_TOOLS_URL =
  "https://raw.githubusercontent.com/googleads/google-ads-mcp/main/tests/smoke/golden_tools_list.json";
const UPSTREAM_RESOURCES_URL =
  "https://raw.githubusercontent.com/googleads/google-ads-mcp/main/tests/smoke/golden_resources_list.json";

export async function checkGoogleAdsMcpSource(env) {
  const [upstreamTools, upstreamResources] = await Promise.all([
    fetchJson(UPSTREAM_TOOLS_URL),
    fetchJson(UPSTREAM_RESOURCES_URL),
  ]);

  const localToolNames = new Set(workerTools(env).map((tool) => tool.name));
  const localResourceNames = new Set(GOOGLE_ADS_RESOURCES.map((resource) => resource.name));
  const localResourceUris = new Set(GOOGLE_ADS_RESOURCES.map((resource) => resource.uri));

  const upstreamToolNames = (upstreamTools.tools || []).map((tool) => tool.name).sort();
  const upstreamResourcesList = upstreamResources.resources || [];
  const upstreamResourceNames = upstreamResourcesList.map((resource) => resource.name).sort();
  const upstreamResourceUris = upstreamResourcesList.map((resource) => resource.uri).sort();

  const missing = {
    tools: upstreamToolNames.filter((name) => !localToolNames.has(name)),
    resourceNames: upstreamResourceNames.filter((name) => !localResourceNames.has(name)),
    resourceUris: upstreamResourceUris.filter((uri) => !localResourceUris.has(uri)),
  };
  const ok = !missing.tools.length && !missing.resourceNames.length && !missing.resourceUris.length;

  return {
    ok,
    checkedAt: new Date().toISOString(),
    summary: ok
      ? "Local Google-compatible MCP surface matches the upstream smoke manifests."
      : "Upstream Google Ads MCP added or changed tools/resources. Review missing items before updating this live-action MCP.",
    upstream: {
      repository: "googleads/google-ads-mcp",
      toolsUrl: UPSTREAM_TOOLS_URL,
      resourcesUrl: UPSTREAM_RESOURCES_URL,
    },
    local: {
      toolCount: localToolNames.size,
      resourceCount: localResourceNames.size,
    },
    upstreamCounts: {
      toolCount: upstreamToolNames.length,
      resourceCount: upstreamResourceNames.length,
    },
    missing,
    extraLocalGoogleCompatibleTools: [...localToolNames]
      .filter((name) => name.includes("google_ads") || name.includes("metadata") || name.includes("customers_") || name === "search_search")
      .sort(),
  };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.raw+json, application/json",
      "User-Agent": "EPF Google Ads MCP Source Monitor",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}
