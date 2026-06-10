"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CRM_STORAGE_KEY = "epf.crm.clients";
const adSignals = ["ad", "ads", "google", "gmb", "ppc", "campaign", "search"];
const mcpServerUrl = "https://epf-google-ads-mcp.webtoronto22.workers.dev/mcp";
const mcpHealthUrl = "https://epf-google-ads-mcp.webtoronto22.workers.dev/health";

const mcpSetupSteps = [
  "Open ChatGPT Developer Mode custom MCP app setup.",
  "Name it EPF Google Ads.",
  `Set Server URL to ${mcpServerUrl}.`,
  "Set Authentication to No Auth.",
  "Create the app, then ask ChatGPT to list campaigns or show ad assets.",
];

const mcpReadTools = [
  "list_campaigns",
  "get_campaign_performance",
  "get_search_terms",
  "list_ad_groups",
  "list_keywords",
  "list_ads",
  "list_responsive_search_ads",
  "get_ad_assets",
  "keyword_ideas",
  "get_keyword_volume",
  "get_keyword_forecast",
  "list_negative_keywords",
  "list_landing_pages",
  "get_change_history",
];

const mcpWriteTools = [
  "create_paused_campaign",
  "create_paused_ad_group",
  "create_paused_responsive_search_ad",
  "add_negative_keywords_after_approval",
  "update_budget_after_approval",
  "set_campaign_status_after_approval",
  "set_ad_group_status_after_approval",
  "set_ad_status_after_approval",
  "add_keywords_after_approval",
];

const mcpPromptExamples = [
  "Show me all Google Ads campaigns with budget, status, clicks, cost, and conversions for the last 30 days.",
  "Show the actual responsive search ad headlines and descriptions for each ad group.",
  "Find keyword ideas for popcorn ceiling removal in Mississauga and show monthly volume, competition, and top-of-page bids.",
  "Get keyword volume and bid estimates for popcorn ceiling removal, painted popcorn removal, and smooth ceiling finish.",
  "Find wasted spend and suggest negative keywords. Do not apply anything yet.",
  "Review campaign pcr/Mississuga/Serch and tell me what a human ads manager should fix first.",
  "Create a paused draft campaign plan for popcorn ceiling removal in Mississauga with a $50 daily budget.",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function numberValue(value) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return numberValue(value).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

function parseStoredList(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isAdLead(client = {}) {
  const source = String(client.source || client.leadSource || "").toLowerCase();
  const notes = [
    client.notes,
    client.service,
    client.workNeeded,
    ...(client.communicationLog || []).map((entry) => entry.content),
  ]
    .join(" ")
    .toLowerCase();

  return source === "website" || source === "phone" || adSignals.some((signal) => source.includes(signal) || notes.includes(signal));
}

function statValue(client = {}) {
  return numberValue(client.estimateAmount || client.balanceDue);
}

function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>}
    </div>
  );
}

function Row({ label, value, detail }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="block truncate font-black text-slate-900">{label}</span>
        {detail && <span className="block truncate text-xs font-bold text-slate-500">{detail}</span>}
      </span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}

function InstructionCard({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CopyBlock({ children }) {
  return (
    <code className="block break-all rounded-md border border-slate-200 bg-slate-950 px-3 py-2 text-xs font-bold leading-relaxed text-white">
      {children}
    </code>
  );
}

export default function AdsManagementPage() {
  const [clients, setClients] = useState([]);
  const [syncStatus, setSyncStatus] = useState("Loading CRM lead data...");

  useEffect(() => {
    let cancelled = false;

    function loadLocal() {
      try {
        const localClients = parseStoredList(window.localStorage.getItem(CRM_STORAGE_KEY));
        if (!cancelled && localClients.length) setClients(localClients.filter((client) => !client.deletedAt));
      } catch {}
    }

    async function loadCloud() {
      loadLocal();
      try {
        const res = await fetch("/api/crm", { cache: "no-store" });
        if (!res.ok) throw new Error("CRM unavailable");
        const data = await res.json();
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items.filter((client) => !client.deletedAt) : [];
        setClients(items);
        setSyncStatus(`Loaded ${items.length} CRM lead(s)`);
      } catch {
        if (!cancelled) setSyncStatus("Using local CRM lead data. Cloud CRM is unavailable.");
      }
    }

    loadCloud();
    return () => {
      cancelled = true;
    };
  }, []);

  const adsClients = useMemo(() => clients.filter(isAdLead), [clients]);
  const openLeads = adsClients.filter((client) => !["Won", "Lost"].includes(client.leadStatus));
  const wonLeads = adsClients.filter((client) => client.leadStatus === "Won");
  const sentEstimates = adsClients.filter((client) => client.leadStatus === "Estimate Sent" || client.estimateIds?.length);
  const followUpsDue = adsClients.filter(
    (client) => client.followUpDate && client.followUpDate <= todayISO() && !["Won", "Lost"].includes(client.leadStatus)
  );
  const closeRate = sentEstimates.length ? Math.round((wonLeads.length / sentEstimates.length) * 100) : 0;
  const openValue = openLeads.reduce((sum, client) => sum + statValue(client), 0);
  const wonValue = wonLeads.reduce((sum, client) => sum + statValue(client), 0);

  const serviceRows = [...new Set(adsClients.map((client) => client.service || client.workNeeded).filter(Boolean))]
    .map((service) => {
      const matches = adsClients.filter((client) => [client.service, client.workNeeded].filter(Boolean).join(" ").includes(service));
      return { label: service, count: matches.length, value: matches.reduce((sum, client) => sum + statValue(client), 0) };
    })
    .sort((a, b) => b.value - a.value || b.count - a.count)
    .slice(0, 8);

  const cityRows = [...new Set(adsClients.map((client) => client.city).filter(Boolean))]
    .map((city) => {
      const matches = adsClients.filter((client) => client.city === city);
      return { label: city, count: matches.length, value: matches.reduce((sum, client) => sum + statValue(client), 0) };
    })
    .sort((a, b) => b.count - a.count || b.value - a.value)
    .slice(0, 8);

  const workflow = [
    "Review performance and search terms before changing spend.",
    "Create campaigns, ad groups, ads, and keywords paused first.",
    "Use phrase or exact match keywords by default.",
    "Add negative keywords from wasted search terms before raising budgets.",
    "Pause underperforming items instead of deleting them.",
    "Apply budget or enable changes only after exact approval.",
  ];

  return (
    <main className="min-h-dvh bg-slate-100 px-3 py-4 text-slate-900 md:px-5">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <Link href="/" className="text-xs font-bold text-blue-700 hover:underline">
              Back to menu
            </Link>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">Ads Management</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">{syncStatus}</p>
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

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tracked ad leads" value={adsClients.length} detail="Website, phone, Google, GMB, PPC signals" />
          <StatCard label="Open ad value" value={money(openValue)} detail={`${openLeads.length} active lead(s)`} />
          <StatCard label="Won ad value" value={money(wonValue)} detail={`${wonLeads.length} won job(s)`} />
          <StatCard label="Close rate" value={`${closeRate}%`} detail={`${wonLeads.length}/${sentEstimates.length || 0} won from estimated`} />
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <InstructionCard title="ChatGPT MCP Setup">
            <div className="space-y-3">
              <CopyBlock>{mcpServerUrl}</CopyBlock>
              <ol className="space-y-2">
                {mcpSetupSteps.map((item, index) => (
                  <li key={item} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">{index + 1}</span>
                    <span className="text-sm font-bold text-slate-800">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </InstructionCard>

          <InstructionCard title="Safety Mode">
            <div className="space-y-3 text-sm font-bold text-slate-700">
              <p>Current hosted MCP mode is No Auth for ChatGPT connection.</p>
              <p>Live write actions are disabled by default. Write tools return preview only until Cloudflare variable CONFIRM_WRITE_ACTION is set to true.</p>
              <p>New campaigns, ad groups, and ads must be created paused first. Enable or budget changes require exact approval.</p>
              <p>Keyword Planner tools require Basic or Standard Google Ads API developer-token access. Explorer access cannot return keyword ideas, volume, bids, or forecasts.</p>
              <CopyBlock>{mcpHealthUrl}</CopyBlock>
            </div>
          </InstructionCard>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
            <h2 className="text-lg font-black">Daily Ads Queue</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">Clean up lead handling before changing campaign spend.</p>
            <div className="mt-3 grid gap-2">
              <Row label="New paid leads" value={adsClients.filter((client) => client.leadStatus === "New Lead").length} detail="Call or text first." />
              <Row label="Follow-ups due" value={followUpsDue.length} detail="Recover leads before optimization." />
              <Row label="Estimates waiting" value={adsClients.filter((client) => client.leadStatus === "Estimate Sent").length} detail="Follow up before marking traffic low quality." />
              <Row label="Lost ad leads" value={adsClients.filter((client) => client.leadStatus === "Lost").length} detail="Review search terms and negatives." />
            </div>
          </div>

          <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
            <h2 className="text-lg font-black">Approval Workflow</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">Rules for safe Google Ads management.</p>
            <div className="mt-3 space-y-2">
              {workflow.map((item, index) => (
                <div key={item} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">{index + 1}</span>
                  <p className="text-sm font-bold text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
            <h2 className="text-lg font-black">Services To Push</h2>
            <div className="mt-3 space-y-2">
              {serviceRows.map((row) => (
                <Row key={row.label} label={row.label} value={`${row.count} / ${money(row.value)}`} />
              ))}
              {!serviceRows.length && <p className="text-sm font-bold text-slate-500">No ad-service patterns yet.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
            <h2 className="text-lg font-black">Cities To Watch</h2>
            <div className="mt-3 space-y-2">
              {cityRows.map((row) => (
                <Row key={row.label} label={row.label} value={`${row.count} / ${money(row.value)}`} />
              ))}
              {!cityRows.length && <p className="text-sm font-bold text-slate-500">No ad-city patterns yet.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
            <h2 className="text-lg font-black">Main MCP Tools</h2>
            <p className="mt-1 text-sm font-bold text-slate-600">Use these from ChatGPT after connecting the MCP app.</p>
            <div className="mt-3 grid gap-2">
              {[...mcpReadTools, ...mcpWriteTools].map((item) => (
                <span key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
          <h2 className="text-lg font-black">Useful ChatGPT Prompts</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {mcpPromptExamples.map((prompt) => (
              <div key={prompt} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-800">
                {prompt}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
