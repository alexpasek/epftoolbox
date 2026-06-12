# EPF Google Ads MCP

## Project Purpose

This repository is an internal Google Ads MCP server for EPF Pro Services.

EPF Pro Services is a local home improvement company focused on popcorn ceiling removal, ceiling refinishing, drywall repair, skim coating, interior painting, wallpaper removal, and related renovation services.

The MCP server connects Codex or ChatGPT to the Google Ads API so the business can analyze and manage its own Google Ads account safely.

## Safety Rules

- Follow the detailed approval-first operating rules in `UNIVERSAL_MCP_RULES.md` for all Google Ads MCP work through Codex, ChatGPT, or other assistants.
- Never create live enabled campaigns, ad groups, ads, or keywords by default.
- Newly created campaign objects must default to `PAUSED`.
- Never delete campaigns, ad groups, ads, or keywords from this server. Pause instead.
- Never increase budget without exact approval from the user.
- Never use broad match keywords by default. Prefer phrase or exact match.
- All Google Ads write tools must support a dry-run approval workflow.

## EPF Business Rules

Main services:

- Popcorn ceiling removal
- Ceiling refinishing
- Drywall repair
- Interior painting
- Wallpaper removal
- Skim coating
- Ceiling repair

Main locations:

- Mississauga
- Oakville
- Burlington
- Hamilton
- Etobicoke
- Toronto
- Milton
- Stoney Creek
- Grimsby

Campaigns should use service + city naming:

```text
EPF - Popcorn Ceiling Removal - Mississauga
```

Prefer campaigns and ad groups with clear local intent.

## Keyword Rules

Prefer high-intent keywords like:

- `popcorn ceiling removal mississauga`
- `popcorn ceiling removal near me`
- `ceiling refinishing mississauga`
- `drywall repair mississauga`
- `interior painting mississauga`

Avoid low-intent or DIY terms unless the user approves:

- `how to remove popcorn ceiling`
- `DIY popcorn ceiling removal`
- `popcorn ceiling tools`
- `cheapest`
- `free`
- `jobs`
- `salary`
- `training`

Always flag negative keyword candidates that include:

- `DIY`
- `free`
- `job`
- `jobs`
- `salary`
- `course`
- `training`
- `tools`
- `spray can`
- `asbestos test only`
- `home depot`
- `rental equipment`

Do not automatically add negative keywords. Show suggestions first.

## Approval Workflow

For any tool that changes Google Ads data:

1. Prepare the exact proposed change.
2. Return the proposed change to the user with `requiresApproval: true`.
3. Apply the change only when the user clearly requests apply mode.

The JavaScript helpers are `suggestChanges` and `applyChangesAfterApproval` in `src/safety/approval.js`.

## Tech Stack

Use:

- JavaScript modules
- Node.js
- `@modelcontextprotocol/sdk`
- `google-ads-api`
- `zod`
- `dotenv`

The implementation uses `.js` files. `tsconfig.json` is included only for editor checking with `allowJs`.

## Required Environment Variables

Credentials are loaded from `.env`. Never hardcode secrets.

```env
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_CUSTOMER_ID=
```

Store account IDs without dashes.

## Commands

```bash
npm install
npm run dev
npm run build
npm start
npm run token
```
