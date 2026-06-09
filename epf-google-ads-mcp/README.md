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

- `get_campaign_performance`
- `get_search_terms`

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
