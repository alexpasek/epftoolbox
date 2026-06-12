"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const mcpServerUrl = "https://epf-google-ads-mcp.webtoronto22.workers.dev/mcp";
const mcpHealthUrl = "https://epf-google-ads-mcp.webtoronto22.workers.dev/health";
const sourceCheckUrl = "https://epf-google-ads-mcp.webtoronto22.workers.dev/source-check";

const statusCards = [
  {
    label: "MCP",
    value: "Live",
    detail: "Streamable HTTP",
  },
  {
    label: "Live Writes",
    value: "Approval-Gated",
    detail: "apply=true and APPROVER",
  },
  {
    label: "Google Ads API",
    value: "v24",
    detail: "Generic search + metadata",
  },
  {
    label: "Source Monitor",
    value: "Monthly",
    detail: "Dashboard-only check",
  },
  {
    label: "Cron",
    value: "Day 1",
    detail: "09:00 UTC",
  },
];

const toolGroups = [
  {
    title: "Google-Compatible API",
    tools: [
      "customers_list_accessible_customers",
      "metadata_get_resource_metadata",
      "search_search",
      "search_google_ads_query",
      "resource://discovery-document",
      "resource://metrics",
      "resource://segments",
      "resource://release-notes",
    ],
  },
  {
    title: "Account Audit",
    tools: [
      "get_customer_info",
      "list_campaigns",
      "get_account_summary",
      "get_campaign_details",
      "audit_campaign_targeting",
      "diagnose_ad_serving_readiness",
      "get_change_history",
    ],
  },
  {
    title: "Performance & Search Terms",
    tools: [
      "get_campaign_performance",
      "get_ad_group_performance",
      "get_keyword_performance",
      "get_ad_performance",
      "get_search_terms",
      "get_search_term_performance",
      "analyze_search_terms",
      "find_wasted_spend",
      "suggest_negative_keywords",
      "suggest_paused_keywords",
    ],
  },
  {
    title: "Keywords & Negatives",
    tools: [
      "list_keywords",
      "list_negative_keywords",
      "list_negative_keyword_lists",
      "get_negative_keyword_list_keywords",
      "list_all_negative_keywords",
      "keyword_ideas",
      "get_keyword_volume",
      "get_keyword_forecast",
    ],
  },
  {
    title: "Assets & Targeting",
    tools: [
      "list_ads",
      "list_responsive_search_ads",
      "get_ad_assets",
      "get_ad_details",
      "list_assets",
      "list_campaign_locations",
      "list_campaign_languages",
      "list_ad_schedule",
      "list_device_performance",
      "list_landing_pages",
      "list_conversion_actions",
    ],
  },
  {
    title: "Approval-Gated Actions",
    tools: [
      "build_epf_search_campaign_plan",
      "generate_epf_responsive_search_ads",
      "create_paused_campaign",
      "create_paused_ad_group",
      "create_paused_responsive_search_ad",
      "create_epf_campaign_from_plan_after_approval",
      "add_keywords_after_approval",
      "add_negative_keywords_after_approval",
      "remove_negative_keyword_after_approval",
      "rename_campaign_after_approval",
      "rename_ad_group_after_approval",
      "create_paused_responsive_search_ad_after_approval",
      "update_responsive_search_ad_after_approval",
      "set_ad_status_after_approval",
      "update_budget_after_approval",
      "update_keyword_match_type_after_approval",
      "update_keyword_bid_after_approval",
      "set_campaign_status_after_approval",
      "add_location_target_after_approval",
      "remove_location_target_after_approval",
      "set_location_bid_modifier_after_approval",
      "add_language_after_approval",
      "remove_language_after_approval",
      "add_ad_schedule_after_approval",
      "remove_ad_schedule_after_approval",
      "set_ad_schedule_bid_modifier_after_approval",
      "change_bidding_strategy_after_approval",
      "create_sitelink_asset_after_approval",
      "attach_sitelink_to_campaign_after_approval",
      "create_callout_asset_after_approval",
      "attach_callout_to_campaign_after_approval",
      "create_image_asset_after_approval",
      "attach_image_to_campaign_after_approval",
      "attach_asset_after_approval",
      "remove_asset_link_after_approval",
      "apply_recommendation_after_approval",
      "create_label_after_approval",
    ],
  },
];

const safetyRules = [
  "Read, reporting, analysis, and suggestion tools can run directly.",
  "Write tools require apply=true and exact approval text.",
  "New campaigns, ad groups, ads, and keywords must be created paused first.",
  "Broad match, budget, bidding, enable, pause, remove, and final URL changes need explicit approval.",
];

const approvalText = [
  {
    label: "Exact approval text",
    value: "APPROVER",
  },
];

const promptExamples = [
  "Audit all active campaigns for budget, conversions, targeting, negatives, and landing pages. Do not apply changes.",
  "Run source-check and tell me whether Google upstream added MCP tools or resources.",
  "Use get_resource_metadata for campaign, then search_google_ads to query optimization score and search impression share.",
  "Analyze search terms from the last 30 days and group them into good intent, negative candidates, and watch list.",
  "Build a paused EPF campaign plan for popcorn ceiling removal in Mississauga. Show the plan before applying.",
];

const troubleshooting = [
  {
    issue: "ChatGPT does not show the newest tools",
    fix: "Remove and recreate the custom MCP app, or refresh the app connection so ChatGPT reloads tools/list.",
  },
  {
    issue: "Keyword Planner returns DEVELOPER_TOKEN_NOT_APPROVED",
    fix: "Apply for Basic or Standard access in Google Ads API Center. Explorer access cannot use Keyword Planner API methods.",
  },
  {
    issue: "Source monitor shows missing upstream items",
    fix: "Review /source-check, compare against googleads/google-ads-mcp, then add only safe read/resource features.",
  },
];

function Card({ title, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-300 bg-white p-4 shadow-md shadow-slate-300/50 ${className}`}>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CopyBlock({ children }) {
  return (
    <code className="block break-all rounded-md border border-slate-200 bg-slate-950 px-3 py-2 text-xs font-bold leading-relaxed text-white">
      {children}
    </code>
  );
}

function Pill({ children }) {
  return (
    <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-800">
      {children}
    </span>
  );
}

function SourceMonitorPanel() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const res = await fetch(sourceCheckUrl, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "Source check failed.");
      setState({ loading: false, data, error: "" });
    } catch (error) {
      setState({ loading: false, data: null, error: error.message || "Source check failed." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const missingCount = useMemo(() => {
    const missing = state.data?.missing || {};
    return (missing.tools || []).length + (missing.resourceNames || []).length + (missing.resourceUris || []).length;
  }, [state.data]);

  const status = state.loading ? "Checking" : state.error ? "Error" : state.data?.ok ? "OK" : "Review";
  const statusClass = state.loading
    ? "bg-slate-100 text-slate-700"
    : state.error || !state.data?.ok
      ? "bg-amber-100 text-amber-900"
      : "bg-emerald-100 text-emerald-900";

  return (
    <Card title="Source Monitor">
      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <span className={`rounded-md px-3 py-2 text-sm font-black ${statusClass}`}>{status}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {state.error || state.data?.summary || "Checking Google upstream smoke manifests."}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Last check: {state.data?.checkedAt ? new Date(state.data.checkedAt).toLocaleString() : "not loaded"}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-black text-white disabled:opacity-60"
          disabled={state.loading}
        >
          Refresh
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Metric label="Upstream tools" value={state.data?.upstreamCounts?.toolCount ?? "-"} />
        <Metric label="Local tools" value={state.data?.local?.toolCount ?? "-"} />
        <Metric label="Missing items" value={state.error ? "-" : missingCount} />
      </div>

      {missingCount > 0 && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-950">
          Review missing tools/resources in the JSON endpoint before updating this live-action MCP.
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export default function AdsManagementPage() {
  return (
    <main className="min-h-dvh bg-slate-100 px-3 py-4 text-slate-900 md:px-5">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <Link href="/" className="text-xs font-bold text-blue-700 hover:underline">
              Back to menu
            </Link>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">Ads Management MCP</h1>
            <p className="mt-1 max-w-3xl text-sm font-bold text-slate-600">
              Live operating panel for the EPF Google Ads MCP connector, source monitor, and approval-gated account actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/crm" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-black">
              CRM
            </Link>
            <a
              href="https://ads.google.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-blue-700 px-3 py-2 text-sm font-black text-white"
            >
              Google Ads
            </a>
          </div>
        </header>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statusCards.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
              <p className="text-xs font-black uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-black text-slate-950">{item.value}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <Card title="Live Endpoints">
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-black uppercase text-slate-500">MCP server</p>
                <CopyBlock>{mcpServerUrl}</CopyBlock>
              </div>
              <div>
                <p className="mb-1 text-xs font-black uppercase text-slate-500">Health check</p>
                <CopyBlock>{mcpHealthUrl}</CopyBlock>
              </div>
              <div>
                <p className="mb-1 text-xs font-black uppercase text-slate-500">Monthly source check</p>
                <CopyBlock>{sourceCheckUrl}</CopyBlock>
              </div>
            </div>
          </Card>

          <SourceMonitorPanel />
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <Card title="Safety Rules">
            <div className="space-y-2">
              {safetyRules.map((rule, index) => (
                <div key={rule} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-800">{rule}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Approval Text">
            <div className="space-y-3">
              {approvalText.map((item) => (
                <div key={item.label}>
                  <p className="mb-1 text-xs font-black uppercase text-slate-500">{item.label}</p>
                  <CopyBlock>{item.value}</CopyBlock>
                </div>
              ))}
              <p className="text-sm font-bold text-slate-700">
                Live writes are enabled, but the MCP still requires apply=true and exact approval text for write tools.
              </p>
            </div>
          </Card>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-2">
          {toolGroups.map((group) => (
            <Card key={group.title} title={group.title}>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.tools.map((tool) => (
                  <Pill key={tool}>{tool}</Pill>
                ))}
              </div>
            </Card>
          ))}
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <Card title="Useful ChatGPT Prompts">
            <div className="space-y-2">
              {promptExamples.map((prompt) => (
                <div key={prompt} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-800">
                  {prompt}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Troubleshooting">
            <div className="space-y-2">
              {troubleshooting.map((item) => (
                <div key={item.issue} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-900">{item.issue}</p>
                  <p className="mt-1 text-sm font-bold text-slate-600">{item.fix}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
