# EPF Google Ads MCP

Safe Google Ads MCP server for EPF Pro Services. It is designed for a GPT/Codex agent to read, optimize, and manage the Google Ads account through an approval-first workflow.

The server exposes MCP tools for:

- Campaign and search-term reporting
- Wasted spend analysis
- Negative keyword suggestions
- Creating paused campaigns, ad groups, responsive search ads, and keywords
- Budget proposals with approval-first application
- EPF service + city campaign naming
- Low-intent keyword blocking unless approved
- Negative keyword flagging for DIY/free/jobs/tools terms
- Keyword Planner ideas, monthly volume, competition, bid estimates, and forecasts

## Setup

```bash
npm install
cp .env.example .env
npm run token
npm run dev
```

Google Ads customer IDs must be saved without dashes.

## Safety Model

Read/report/suggestion tools run directly and never mutate the account.

Write tools default to dry-run proposals and return `requiresApproval: true`. To apply a proposed change, call the same tool with:

```json
{
  "apply": true,
  "approvalText": "APPROVE GOOGLE ADS CHANGE"
}
```

For negative keyword application, use:

```json
{
  "apply": true,
  "approvalText": "APPROVE ADD NEGATIVE KEYWORDS"
}
```

New campaigns, ad groups, and ads are always created `PAUSED`. Enabling existing resources is only available through `*_after_approval` tools. The server does not expose delete tools.

Campaigns should use EPF local naming:

```text
EPF - Popcorn Ceiling Removal - Mississauga
```

You can pass `service` and `city` to `create_paused_campaign`; the tool builds the EPF campaign name.

Reports include campaign name, spend, clicks, impressions, CTR, CPC, and conversions.

## Tools

Read tools:

- `get_customer_info`
- `list_campaigns`
- `list_ad_groups`
- `list_keywords`
- `list_ads`
- `list_responsive_search_ads`
- `get_ad_assets`
- `list_negative_keywords`
- `get_campaign_performance`
- `get_search_terms`
- `keyword_ideas`
- `get_keyword_volume`
- `get_keyword_forecast`

Keyword Planner tools:

- `keyword_ideas`: find new keyword ideas from seed keywords or seed URL.
- `get_keyword_volume`: return average monthly searches, monthly search volume history, competition, and top-of-page bid estimates.
- `get_keyword_forecast`: return forecast clicks, impressions, cost, conversions, CTR, and CPC for proposed keywords.

Google Ads API access note:

Keyword Planner API methods are not available with Explorer access developer tokens. If these tools return `DEVELOPER_TOKEN_NOT_APPROVED`, apply for Basic or Standard access in Google Ads API Center. Normal campaign, ad, keyword, and reporting read tools can still work while the token is Explorer access.

Default targeting examples:

```json
{
  "keywords": ["popcorn ceiling removal mississauga"],
  "language": "languageConstants/1000",
  "geoTargetConstants": ["geoTargetConstants/2124"],
  "keywordPlanNetwork": "GOOGLE_SEARCH"
}
```

Suggestion-only optimization tools:

- `find_wasted_spend`
- `suggest_negative_keywords`
- `suggest_budget_changes`
- `suggest_paused_keywords`

Paused create tools:

- `create_paused_campaign`
- `create_paused_ad_group`
- `create_paused_responsive_search_ad`

Approval-gated control tools:

- `add_negative_keywords_after_approval`
- `set_campaign_status_after_approval`
- `set_ad_group_status_after_approval`
- `set_keyword_status_after_approval`
- `update_budget_after_approval`
- `add_keywords_after_approval`

Recommended agent workflow:

1. Run reporting/search-term tools.
2. Run suggestion tools.
3. Present exact proposed changes.
4. Apply only after the user gives the exact approval text.

## MCP Usage

This repository includes a project-scoped Codex config at `.codex/config.toml`.

To use the server from Codex, restart Codex in this project and run `/mcp` to confirm `epf_google_ads` is connected.

Manual config for another Codex environment:

```toml
[mcp_servers.epf_google_ads]
command = "node"
args = ["src/server.js"]
cwd = "/Users/alex/epf-toolbox/epf-google-ads-mcp"
startup_timeout_sec = 20
tool_timeout_sec = 120
default_tools_approval_mode = "prompt"
```

For ChatGPT outside Codex, use a hosted MCP/App bridge rather than this local stdio config. Keep the same tool safety model and never expose `.env` secrets to the client UI.

## Cloudflare Hosted MCP

This project also includes a Cloudflare Worker HTTP MCP server:

```bash
cd epf-google-ads-mcp
npm install
npm run worker:dry-run
npm run worker:deploy
```

The hosted endpoint is:

```text
https://epf-google-ads-mcp.<your-workers-subdomain>.workers.dev/mcp
```

The hosted server requires bearer auth. Configure these Cloudflare Worker secrets:

```text
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_REFRESH_TOKEN
GOOGLE_ADS_LOGIN_CUSTOMER_ID
GOOGLE_ADS_CUSTOMER_ID
MCP_BEARER_TOKEN
```

For ChatGPT Developer Mode testing, `wrangler.toml` sets:

```toml
[vars]
MCP_AUTH_MODE = "no_auth"
CONFIRM_WRITE_ACTION = "true"
```

`MCP_AUTH_MODE=no_auth` allows ChatGPT's custom MCP app screen to connect with **No Auth**.

`MCP_AUTH_MODE=bearer` keeps production bearer-token protection for direct API/MCP clients.

`CONFIRM_WRITE_ACTION=true` allows live Google Ads write APIs only when the tool is called with `apply: true` and the exact approval text.

If you set `CONFIRM_WRITE_ACTION=false`, every write tool returns only a preview:

```text
Preview only. Set CONFIRM_WRITE_ACTION=true to allow live Google Ads changes.
```

Read-only tools still work in no-auth mode. With live writes enabled, keep approval prompts strict and review proposed changes before calling approval-gated tools.

Example:

```bash
npx wrangler secret put GOOGLE_ADS_DEVELOPER_TOKEN
npx wrangler secret put GOOGLE_ADS_CLIENT_ID
npx wrangler secret put GOOGLE_ADS_CLIENT_SECRET
npx wrangler secret put GOOGLE_ADS_REFRESH_TOKEN
npx wrangler secret put GOOGLE_ADS_LOGIN_CUSTOMER_ID
npx wrangler secret put GOOGLE_ADS_CUSTOMER_ID
npx wrangler secret put MCP_BEARER_TOKEN
```

Deploy:

```bash
npm run worker:dry-run
npm run worker:deploy
```

Test:

```bash
curl https://epf-google-ads-mcp.webtoronto22.workers.dev/health
curl https://epf-google-ads-mcp.webtoronto22.workers.dev/mcp
```

ChatGPT Developer Mode custom MCP app:

```text
Name: EPF Google Ads
Server URL: https://epf-google-ads-mcp.webtoronto22.workers.dev/mcp
Authentication: No Auth
```

For Codex HTTP MCP:

```toml
[mcp_servers.epf_google_ads_hosted]
url = "https://epf-google-ads-mcp.<your-workers-subdomain>.workers.dev/mcp"
bearer_token_env_var = "EPF_GOOGLE_ADS_MCP_TOKEN"
default_tools_approval_mode = "prompt"
```
