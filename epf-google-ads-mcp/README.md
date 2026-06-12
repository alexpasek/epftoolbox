# EPF Google Ads MCP

Safe Google Ads MCP server for EPF Pro Services. It is designed for a GPT/Codex agent to read, optimize, and manage the Google Ads account through an approval-first workflow.

The server exposes MCP tools for:

- Campaign and search-term reporting
- Generic Google Ads API search with resource metadata lookup
- Official Google Ads API discovery, metrics, segments, and release-notes resources
- Accessible customer discovery
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
  "approvalText": "APPROVER"
}
```

For negative keyword application, use:

```json
{
  "apply": true,
  "approvalText": "APPROVER"
}
```

New campaigns, ad groups, and ads are always created `PAUSED`. Enabling existing resources is only available through `*_after_approval` tools. The server does not expose delete tools.

For keyword adds, service-seeking phrases such as `popcorn ceiling removal service`, `remove popcorn ceiling service`, and `ceiling popcorn removal` are core intent terms. Add them as `PHRASE` or `EXACT` with `status: "PAUSED"` when approved; do not require `allowLowIntent` unless the validator reports a specific low-intent fragment such as `diy`, `free`, `jobs`, `salary`, `training`, or `popcorn ceiling tools`.

If the user restates the exact proposed keyword batch, target ad group, match type, paused status, and exact approval text in the current conversation, the agent has enough approval context to call `add_keywords_after_approval` with `apply: true`.

Campaigns should use EPF local naming:

```text
EPF - Popcorn Ceiling Removal - Mississauga
```

You can pass `service` and `city` to `create_paused_campaign`; the tool builds the EPF campaign name.

Reports include campaign name, spend, clicks, impressions, CTR, CPC, and conversions.

## Tools

Read tools:

- `get_customer_info`
- `list_accessible_customers`
- `get_resource_metadata`
- `search_google_ads`
- `search_google_ads_query`
- `list_campaigns`
- `list_ad_groups`
- `list_keywords`
- `list_ads`
- `list_responsive_search_ads`
- `get_ad_assets`
- `list_negative_keywords`
- `list_negative_keyword_lists`
- `get_negative_keyword_list_keywords`
- `list_all_negative_keywords`
- `get_campaign_performance`
- `get_search_terms`
- `keyword_ideas`
- `get_keyword_volume`
- `get_keyword_forecast`

Generic Google Ads API tools:

- `get_resource_metadata`: returns selectable, filterable, and sortable fields for a Google Ads resource, including compatible metrics and segments.
- `search_google_ads`: builds a read-only GAQL query from fields, resource, conditions, ordering, and limit.
- `search_google_ads_query`: runs a raw read-only GAQL `SELECT` query. It rejects mutation-style statements and does not expose writes.
- Google-compatible aliases are also available: `customers_list_accessible_customers`, `metadata_get_resource_metadata`, and `search_search`.

Resources:

- `resource://discovery-document`: official Google Ads API REST discovery document.
- `resource://metrics`: official Google Ads API metrics reference.
- `resource://segments`: official Google Ads API segments reference.
- `resource://release-notes`: official Google Ads API release notes.

The Worker REST client defaults to Google Ads API `v24`, matching the upstream `googleads/google-ads-mcp` source. Set `GOOGLE_ADS_API_VERSION` if you need to pin another version.

## Monthly Upstream Source Check

The Cloudflare Worker has a monthly cron schedule:

```toml
crons = ["0 9 1 * *"]
```

On the first day of every month at 09:00 UTC, it compares this MCP server against the upstream `googleads/google-ads-mcp` smoke manifests:

- `tests/smoke/golden_tools_list.json`
- `tests/smoke/golden_resources_list.json`

Manual check endpoint:

```text
GET /source-check
```

The check reports any upstream Google-compatible tools or resources missing locally. It does not auto-edit production code and does not send notifications. Use the dashboard or `GET /source-check` to review status.

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

Negative keyword tools:

- `list_negative_keywords`: campaign and ad group negatives.
- `list_negative_keyword_lists`: shared library exclusion lists, such as `popcorn removal - negative core`.
- `get_negative_keyword_list_keywords`: keywords inside one shared negative keyword list by `sharedSetResourceName` or exact `name`.
- `list_all_negative_keywords`: shared library, campaign, and ad group negatives in one response.

Shared list example:

```json
{
  "name": "popcorn removal - negative core",
  "limit": 500
}
```

Suggestion-only optimization tools:

- `find_wasted_spend`
- `suggest_negative_keywords`
- `suggest_budget_changes`
- `suggest_paused_keywords`

Read-only audit tools:

- `audit_campaign_targeting`
- `diagnose_ad_serving_readiness`

Paused create tools:

- `create_paused_campaign`
- `create_paused_ad_group`
- `create_paused_responsive_search_ad`

Approval-gated control tools:

- `rename_campaign_after_approval`
- `rename_ad_group_after_approval`
- `add_negative_keywords_after_approval`
- `remove_negative_keyword_after_approval`
- `set_campaign_status_after_approval`
- `set_ad_group_status_after_approval`
- `set_ad_status_after_approval`
- `set_keyword_status_after_approval`
- `update_ad_group_cpc_bid_after_approval`
- `update_budget_after_approval`
- `set_search_campaign_targeting_after_approval`
- `change_bidding_strategy_after_approval`
- `add_keywords_after_approval`
- `update_keyword_match_type_after_approval`
- `update_keyword_bid_after_approval`
- `update_responsive_search_ad_after_approval`
- `update_ad_final_url_after_approval`
- `update_campaign_final_url_suffix_after_approval`
- `add_location_target_after_approval`
- `remove_location_target_after_approval`
- `set_location_bid_modifier_after_approval`
- `add_language_after_approval`
- `remove_language_after_approval`
- `add_ad_schedule_after_approval`
- `remove_ad_schedule_after_approval`
- `set_ad_schedule_bid_modifier_after_approval`
- `create_sitelink_asset_after_approval`
- `attach_sitelink_to_campaign_after_approval`
- `create_callout_asset_after_approval`
- `attach_callout_to_campaign_after_approval`
- `create_image_asset_after_approval`
- `attach_image_to_campaign_after_approval`
- `create_asset_from_json_after_approval`
- `update_asset_from_json_after_approval`
- `attach_asset_after_approval`
- `remove_asset_link_after_approval`
- `create_call_asset_after_approval`
- `attach_call_asset_to_campaign_after_approval`
- `create_structured_snippet_asset_after_approval`
- `attach_structured_snippet_to_campaign_after_approval`
- `set_device_bid_modifier_after_approval`
- `dismiss_recommendation_after_approval`
- `apply_recommendation_after_approval`
- `create_label_after_approval`
- `apply_label_to_campaign_after_approval`
- `apply_label_to_ad_group_after_approval`
- `apply_label_to_keyword_after_approval`
- `apply_label_to_ad_after_approval`

Rename example:

```json
{
  "resourceName": "customers/9466544876/campaigns/123",
  "newName": "EPF - Popcorn Ceiling Removal - Mississauga",
  "apply": true,
  "approvalText": "APPROVER"
}
```

Search-only targeting example:

```json
{
  "campaignResourceName": "customers/9466544876/campaigns/123",
  "apply": true,
  "approvalText": "APPROVER"
}
```

Campaign final URL suffix example:

```json
{
  "campaignResourceName": "customers/9466544876/campaigns/123",
  "finalUrlSuffix": "utm_source=google&utm_medium=cpc&utm_campaign=drywall_repair",
  "apply": true,
  "approvalText": "APPROVER"
}
```

Image asset example:

```json
{
  "imageName": "Popcorn Ceiling Before After",
  "imageDataBase64": "data:image/jpeg;base64,...",
  "apply": true,
  "approvalText": "APPROVER"
}
```

Attach image asset example:

```json
{
  "campaignResourceName": "customers/9466544876/campaigns/123",
  "assetResourceName": "customers/9466544876/assets/456",
  "apply": true,
  "approvalText": "APPROVER"
}
```

Generic asset tools cover Google Ads asset types that do not have a dedicated helper yet, including business name, business logo, headline, description, lead form, location, price, app, and promotion assets when supported by the Google Ads API. Use raw Google Ads asset JSON for create/update and attach the resulting asset with the correct `fieldType`.

Generic asset create example:

```json
{
  "assetJson": {
    "name": "EPF Business Name",
    "businessNameAsset": {
      "businessName": "Expert Popcorn Ceiling Removal"
    }
  },
  "apply": true,
  "approvalText": "APPROVER"
}
```

Generic asset attach example:

```json
{
  "campaignResourceName": "customers/9466544876/campaigns/123",
  "assetResourceName": "customers/9466544876/assets/456",
  "fieldType": "BUSINESS_NAME",
  "apply": true,
  "approvalText": "APPROVER"
}
```

Generic asset update example:

```json
{
  "assetResourceName": "customers/9466544876/assets/456",
  "assetJson": {
    "businessNameAsset": {
      "businessName": "EPF Ceiling Removal"
    }
  },
  "updateMask": ["business_name_asset.business_name"],
  "apply": true,
  "approvalText": "APPROVER"
}
```

Campaign targeting audit example:

```json
{
  "campaignResourceName": "customers/9466544876/campaigns/123",
  "limit": 100
}
```

Ad serving readiness diagnosis example:

```json
{
  "campaignResourceName": "customers/9466544876/campaigns/123",
  "keywordText": "drywall repair",
  "limit": 100
}
```

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

For hosted MCP use, `wrangler.toml` sets:

```toml
[vars]
MCP_AUTH_MODE = "bearer"
CONFIRM_WRITE_ACTION = "true"
```

`MCP_AUTH_MODE=bearer` keeps bearer-token protection enabled for direct API/MCP clients. Do not run the hosted Google Ads MCP with `MCP_AUTH_MODE=no_auth` and `CONFIRM_WRITE_ACTION=true`, because that would expose a no-auth write-capable Ads control surface.

`CONFIRM_WRITE_ACTION=true` allows live Google Ads write APIs only when the tool is called with `apply: true` and the exact approval text.

If you set `CONFIRM_WRITE_ACTION=false`, every write tool returns only a preview:

```text
Preview only. Set CONFIRM_WRITE_ACTION=true to allow live Google Ads changes.
```

With live writes enabled, keep approval prompts strict and review proposed changes before calling approval-gated tools.

Safe write workflow:

1. Run the write tool with `apply: false`.
2. Review the proposed mutations, target customer, campaign, budget, locations, keywords, ads, and status.
3. Confirm the change is paused or otherwise intentionally scoped.
4. Run the same write tool with `apply: true` and `approvalText: "APPROVER"`.
5. Audit the campaign after applying to verify Search-only network settings, presence-only targeting, locations, languages, negatives, and paused/enabled status.

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
