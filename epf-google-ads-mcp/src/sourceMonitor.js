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

  const result = {
    ok: true,
    checkedAt: new Date().toISOString(),
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
    missing: {
      tools: upstreamToolNames.filter((name) => !localToolNames.has(name)),
      resourceNames: upstreamResourceNames.filter((name) => !localResourceNames.has(name)),
      resourceUris: upstreamResourceUris.filter((uri) => !localResourceUris.has(uri)),
    },
    extraLocalGoogleCompatibleTools: [...localToolNames]
      .filter((name) => name.includes("google_ads") || name.includes("metadata") || name.includes("customers_") || name === "search_search")
      .sort(),
  };

  result.ok = !result.missing.tools.length && !result.missing.resourceNames.length && !result.missing.resourceUris.length;
  result.summary = result.ok
    ? "Local Google-compatible MCP surface matches the upstream smoke manifests."
    : "Upstream Google Ads MCP added or changed tools/resources. Review missing items before updating this live-action MCP.";

  await notifyIfConfigured(env, result);
  return result;
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

async function notifyIfConfigured(env, result) {
  if (result.ok && env?.SOURCE_MONITOR_NOTIFY_ON_OK !== "true") return;

  const [webhookResult, emailResult] = await Promise.allSettled([
    notifyWebhookIfConfigured(env, result),
    notifyEmailIfConfigured(env, result),
  ]);

  for (const item of [webhookResult, emailResult]) {
    if (item.status === "rejected") {
      console.log(`Source monitor notification failed: ${item.reason?.message || String(item.reason)}`);
    }
  }
}

async function notifyWebhookIfConfigured(env, result) {
  const webhookUrl = env?.SOURCE_MONITOR_WEBHOOK_URL || "";
  if (!webhookUrl) return;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!res.ok) {
    console.log(`Source monitor webhook failed: HTTP ${res.status}`);
  }
}

async function notifyEmailIfConfigured(env, result) {
  const apiKey = env?.RESEND_API_KEY || "";
  const to = env?.SOURCE_MONITOR_NOTIFY_EMAIL || "";
  const from = env?.SOURCE_MONITOR_FROM_EMAIL || "EPF Google Ads MCP <onboarding@resend.dev>";
  if (!apiKey || !to) return;

  const subject = result.ok
    ? "EPF Google Ads MCP source check: no upstream changes"
    : "EPF Google Ads MCP source check: upstream changes found";

  const body = [
    subject,
    "",
    `Checked at: ${result.checkedAt}`,
    `Summary: ${result.summary}`,
    "",
    `Missing tools: ${result.missing.tools.length ? result.missing.tools.join(", ") : "none"}`,
    `Missing resource names: ${result.missing.resourceNames.length ? result.missing.resourceNames.join(", ") : "none"}`,
    `Missing resource URIs: ${result.missing.resourceUris.length ? result.missing.resourceUris.join(", ") : "none"}`,
    "",
    `Upstream tools: ${result.upstreamCounts.toolCount}`,
    `Local tools: ${result.local.toolCount}`,
    `Upstream resources: ${result.upstreamCounts.resourceCount}`,
    `Local resources: ${result.local.resourceCount}`,
    "",
    `Source: ${result.upstream.repository}`,
    `Tools manifest: ${result.upstream.toolsUrl}`,
    `Resources manifest: ${result.upstream.resourcesUrl}`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend email failed: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
}
