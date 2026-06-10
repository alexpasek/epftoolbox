"use client";

import Link from "next/link";

const mcpServerUrl = "https://epf-google-ads-mcp.webtoronto22.workers.dev/mcp";
const mcpHealthUrl = "https://epf-google-ads-mcp.webtoronto22.workers.dev/health";

const setupSteps = [
  "Open ChatGPT settings and create a custom MCP app.",
  "Name it EPF Google Ads.",
  `Use this server URL: ${mcpServerUrl}`,
  "Set Authentication to No Auth.",
  "Create the app, then ask ChatGPT to list campaigns or show ad assets.",
];

const statusCards = [
  {
    label: "MCP Endpoint",
    value: "Live",
    detail: "Streamable HTTP at /mcp",
  },
  {
    label: "ChatGPT Auth",
    value: "No Auth",
    detail: "Enabled for Developer Mode testing",
  },
  {
    label: "Live Writes",
    value: "Preview Only",
    detail: "CONFIRM_WRITE_ACTION=false",
  },
  {
    label: "Keyword Planner",
    value: "Needs API Approval",
    detail: "Requires Basic or Standard Google Ads API access",
  },
];

const toolGroups = [
  {
    title: "Account & Campaign Reads",
    tools: [
      "get_customer_info",
      "list_campaigns",
      "get_campaign_details",
      "get_campaign_performance",
      "get_account_summary",
      "get_change_history",
    ],
  },
  {
    title: "Ads & Creative Reads",
    tools: [
      "list_ads",
      "list_responsive_search_ads",
      "get_ad_assets",
      "get_ad_details",
      "get_ad_performance",
    ],
  },
  {
    title: "Keywords & Search Terms",
    tools: [
      "list_keywords",
      "get_keyword_performance",
      "get_search_terms",
      "analyze_search_terms",
      "find_wasted_spend",
      "suggest_negative_keywords",
      "suggest_paused_keywords",
    ],
  },
  {
    title: "Keyword Planner",
    tools: [
      "keyword_ideas",
      "get_keyword_volume",
      "get_keyword_forecast",
    ],
  },
  {
    title: "Targeting & Reporting",
    tools: [
      "list_campaign_locations",
      "list_campaign_languages",
      "list_ad_schedule",
      "list_device_performance",
      "list_landing_pages",
      "list_conversion_actions",
      "list_google_ads_recommendations",
    ],
  },
  {
    title: "Preview-Only Writes",
    tools: [
      "create_paused_campaign",
      "create_paused_ad_group",
      "create_paused_responsive_search_ad",
      "add_negative_keywords_after_approval",
      "update_budget_after_approval",
      "set_campaign_status_after_approval",
      "set_ad_group_status_after_approval",
      "set_ad_status_after_approval",
      "add_keywords_after_approval",
    ],
  },
];

const safetyRules = [
  "Read, reporting, analysis, and suggestion tools can run directly.",
  "All write tools return preview only while CONFIRM_WRITE_ACTION=false.",
  "New campaigns, ad groups, ads, and keywords must be created paused first.",
  "Do not enable campaigns, raise budgets, or add live keywords without exact approval.",
  "Use phrase or exact match keywords by default. Broad match requires a specific reason.",
  "Pause poor performers instead of deleting them.",
];

const approvalText = [
  {
    label: "General write approval",
    value: "APPROVE GOOGLE ADS CHANGE",
  },
  {
    label: "Negative keyword approval",
    value: "APPROVE ADD NEGATIVE KEYWORDS",
  },
];

const promptExamples = [
  "Show me all campaigns with budget, status, clicks, cost, conversions, CPC, and CPA for the last 30 days.",
  "Show the actual responsive search ad headlines and descriptions for every ad group.",
  "Review the ads and tell me which RSA has weak ad strength or repeated headlines.",
  "Find wasted spend and suggest negative keywords. Do not apply anything.",
  "Analyze search terms and group them into good intent, DIY, jobs, free, and negative candidates.",
  "Create a paused draft campaign plan for popcorn ceiling removal in Mississauga with a $50 daily budget.",
  "Get keyword volume and bid estimates for popcorn ceiling removal Mississauga.",
  "Suggest budget changes based on conversions and cost per conversion, but do not apply them.",
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
    issue: "Write tool says preview only",
    fix: "That is expected. Cloudflare CONFIRM_WRITE_ACTION is false to protect live campaigns.",
  },
  {
    issue: "Need production auth later",
    fix: "Change MCP_AUTH_MODE to bearer and configure MCP_BEARER_TOKEN for direct clients.",
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
              Use this page as the operating guide for managing Google Ads through the hosted ChatGPT MCP connector.
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

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statusCards.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-300 bg-white p-3 shadow-md shadow-slate-300/50">
              <p className="text-xs font-black uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-black text-slate-950">{item.value}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <Card title="ChatGPT MCP Setup">
            <div className="space-y-3">
              <CopyBlock>{mcpServerUrl}</CopyBlock>
              <ol className="space-y-2">
                {setupSteps.map((item, index) => (
                  <li key={item} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>

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
              <p className="text-sm font-bold text-slate-700">
                Expected ChatGPT app settings: Name EPF Google Ads, Authentication No Auth.
              </p>
            </div>
          </Card>
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
                Even with approval text, live writes stay blocked until CONFIRM_WRITE_ACTION=true is set in Cloudflare.
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
