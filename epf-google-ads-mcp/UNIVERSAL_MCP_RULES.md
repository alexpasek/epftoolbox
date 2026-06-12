# Universal Google Ads MCP Agent Rules

Use these rules whenever Codex, ChatGPT, or another assistant works with the EPF Google Ads MCP tools.

The MCP tools can read and change Google Ads data, but tool access is not permission. The agent must work in an approval-first mode for every live account change.

## Core Rule

Default workflow:

```text
Research -> Organize -> Show -> Ask approval -> Apply approved changes -> Verify -> Report
```

Never skip the `Show` and `Ask approval` steps before changing Google Ads unless the user gives clear approval for the exact change in the same conversation.

Clear approval examples:

- `Apply these`
- `Add them`
- `Approved`
- `Go ahead and apply`
- `Yes, update Google Ads`

Not approval:

- `Research keywords`
- `Prepare a plan`
- `Find negatives`
- `Clean this campaign`
- `Research and apply`

If the user asks to research and apply, first show the exact proposed changes, then ask for approval.

## Required Workflow

For keyword research, negative keyword cleanup, campaign optimization, search term cleanup, ad group creation, or keyword additions:

1. Identify the Google Ads account, customer ID, campaign, ad group, service, city, and landing page.
2. Read the current account structure before recommending changes.
3. Pull campaigns, ad groups, positive keywords, negative keywords, shared negative lists, and search terms where relevant.
4. Research new keyword ideas from search terms, converting keywords, Keyword Planner, landing pages, and market/service context.
5. Remove bad-intent, irrelevant, duplicate, and conflicting ideas.
6. Group keywords by service, city, problem type, and search intent.
7. Choose positive keywords and match types.
8. Choose negative keywords, match types, and the correct negative level.
9. Check for duplicates, conflicts, and negatives blocking positives.
10. Show the exact plan to the user.
11. Ask for approval.
12. Apply only the approved changes.
13. Verify changes after applying.
14. Report exactly what changed and what was skipped.

## Account And Campaign Selection

Before any live change, confirm or detect:

- Account name
- Customer ID
- Campaign name and ID
- Ad group name and ID
- Service
- City or service area
- Landing page or final URL

For read-only work, the agent may inspect multiple accounts or campaigns and summarize findings.

For live changes, never guess. Apply changes only to the approved account, campaign, ad group, shared list, or resource.

## Current State First

Before adding or changing anything, inspect:

- Existing campaigns and ad groups
- Existing positive keywords
- Existing campaign-level negatives
- Existing ad-group-level negatives
- Existing shared negative keyword lists
- Existing search terms
- Location targeting
- Bidding strategy
- Budget
- Landing pages or final URLs

This prevents duplicate keywords, bad grouping, wasted spend, and negatives that block good traffic.

## Keyword Intent Rules

Classify every keyword before recommending it.

| Intent | Examples | Default Action |
| --- | --- | --- |
| High-intent service | `popcorn ceiling removal mississauga`, `drywall repair near me`, `interior painting company oakville` | Recommend exact or phrase match |
| Price or quote | `drywall repair cost`, `ceiling repair quote`, `painting estimate` | Recommend carefully, usually exact or phrase |
| Problem/service need | `hole in wall repair`, `ceiling crack repair`, `water damage ceiling repair` | Recommend if the service matches; create a separate ad group if there is enough volume |
| DIY/research | `how to remove popcorn ceiling`, `drywall repair tutorial`, `how to paint a room` | Usually recommend as negatives |
| Jobs/career | `drywall jobs`, `painter salary`, `painting hiring` | Recommend as negatives |
| Tools/materials | `drywall tools`, `paint sprayer rental`, `drywall compound` | Recommend as negatives |

## Positive Keyword Rules

Group positive keywords tightly. Do not put every keyword in one ad group.

Good grouping example:

```text
Campaign: EPF - Popcorn Ceiling Removal - Mississauga

Ad groups:
- Popcorn Ceiling Removal
- Popcorn Ceiling Cost
- Painted Popcorn Ceiling
- Popcorn Ceiling Contractor
```

Preferred match types:

- Use `EXACT` for the strongest local service keywords.
- Use `PHRASE` for useful close variations.
- Do not use `BROAD` by default.

Broad match requires explicit approval and should only be recommended when:

- Conversion tracking works.
- Negative keywords are strong.
- Budget can support testing.
- The campaign has useful conversion history.
- The user approves broad match specifically.

## Negative Keyword Level Rules

Choose the narrowest correct negative level.

| Term Type | Example | Correct Level |
| --- | --- | --- |
| Bad for nearly all services | `jobs`, `salary`, `tutorial`, `youtube` | Shared negative list |
| Bad for one campaign | `popcorn recipe` in a popcorn ceiling campaign | Campaign negative |
| Needed to route traffic between ad groups | `ceiling` inside a wall repair ad group | Ad-group negative |
| Wrong city or service area | `calgary` in a Mississauga campaign | Campaign negative |
| Tool or material intent | `drywall lift`, `scraper rental` | Shared list or campaign negative, depending on scope |
| Competitor brand | Competitor name | Do not add unless user approves |
| Cheap/free intent | `free`, `cheapest` | Shared list or campaign negative; user approval recommended |
| Could be useful in another ad group | `ceiling`, `repair`, `painting` | Ad-group negative only; never shared blindly |

Do not put every negative everywhere.

## Shared Negative List Rules

Use shared lists for terms that are bad across many campaigns.

Recommended shared list:

```text
Universal Bad Intent
```

Candidate terms:

- `diy`
- `do it yourself`
- `how to`
- `tutorial`
- `youtube`
- `reddit`
- `forum`
- `pdf`
- `template`
- `calculator`
- `course`
- `school`
- `training`
- `class`
- `job`
- `jobs`
- `career`
- `salary`
- `hiring`
- `employment`
- `apprenticeship`
- `free`
- `wholesale`
- `supplier`
- `suppliers`
- `tool`
- `tools`
- `rental`
- `rent`
- `equipment`
- `amazon`
- `walmart`
- `home depot`
- `lowes`
- `rona`
- `canadian tire`

Before attaching a shared list to any campaign:

1. Check the campaign service and intent.
2. Check whether any negative could block good traffic.
3. Show the exact list and target campaigns.
4. Ask for approval.

## Campaign-Level Negative Rules

Use campaign-level negatives when the term is bad for the entire campaign.

Examples for a popcorn ceiling removal campaign:

- `popcorn food`
- `popcorn maker`
- `popcorn machine`
- `movie popcorn`
- `caramel popcorn`
- `popcorn recipe`
- `popcorn kernels`

Examples for a drywall repair campaign:

- `drywall sheets`
- `drywall supplier`
- `drywall lift`
- `drywall tools`
- `drywall board`
- `gypsum board`

Do not add a campaign-level negative if the term could be valuable in another ad group in the same campaign.

## Ad-Group-Level Negative Rules

Use ad-group-level negatives to route traffic between ad groups, not to block universally.

Example:

```text
Campaign: EPF - Drywall Repair - Mississauga

Ad Group: Wall Repair
Positive keywords:
- "drywall repair"
- "wall repair"
- "hole in wall repair"

Ad Group: Ceiling Repair
Positive keywords:
- "ceiling repair"
- "ceiling drywall repair"
- "water damage ceiling repair"

Possible ad-group negatives:
- Add `ceiling` to Wall Repair only if it should not receive ceiling traffic.
- Add `hole in wall` to Ceiling Repair only if it should not receive wall repair traffic.
```

## Negative Match Type Rules

Negative match types do not behave like positive match types. Use them carefully.

- Use negative exact when only one exact search is bad, for example `[popcorn machine]`.
- Use negative phrase when a phrase is clearly bad, for example `"how to"` or `"drywall jobs"`.
- Use negative broad only when the term is clearly bad in all contexts, for example `jobs`, `tutorial`, or `youtube`.

Never add broad negatives such as `repair`, `ceiling`, `painting`, `drywall`, or `contractor`; they can block valuable service searches.

## Duplicate And Conflict Checks

Before applying any keyword or negative keyword, check:

- Does the positive keyword already exist?
- Does the negative keyword already exist?
- Does a shared negative list already contain it?
- Does any negative block a proposed positive keyword?
- Is the same keyword already in another ad group?
- Is the same search intent already covered?
- Does the campaign target the right city?
- Does the landing page match the keyword intent?

If there is a conflict, show it before applying anything.

## Search Term Cleanup

When the user asks to clean search terms, add negatives, or optimize keywords:

1. Pull search terms for the selected date range.
2. Include campaign, ad group, cost, clicks, impressions, CTR, CPC, and conversions.
3. Classify each term as one of:
   - Add as positive keyword
   - Add as negative keyword
   - Keep watching
   - Ignore
   - SEO/content opportunity
4. Decide the correct negative level: shared list, campaign, or ad group.
5. Show the recommendation table.
6. Ask for approval.
7. Apply approved negatives only.
8. Verify the changes.

Do not add a negative only because one search term had no conversion. Use both intent and spend.

## Required Output Before Applying

Before any live change, show this structure:

```markdown
## Keyword Research Summary

Account:
Customer ID:
Campaign:
Ad groups checked:
Date range:
Service:
Location:
Landing page:

## New Positive Keywords

| Keyword | Match Type | Campaign | Ad Group | Reason |
| --- | --- | --- | --- | --- |

## Negative Keywords To Add

| Negative | Match Type | Level | Campaign / Ad Group / Shared List | Reason |
| --- | --- | --- | --- | --- |

## Shared Negative List Updates

| Shared List | Keywords To Add | Campaigns To Apply To | Reason |
| --- | --- | --- | --- |

## Conflicts / Warnings

| Issue | Recommendation |
| --- | --- |

## Approval Needed

These are the exact changes I recommend. Approve applying them through MCP?
```

## Applying Changes Through MCP

After approval:

1. Apply only approved items.
2. Add positive keywords only to approved ad groups.
3. Add negatives only at the approved level.
4. Attach shared negative lists only to approved campaigns.
5. Do not change budgets.
6. Do not change bidding.
7. Do not pause, enable, remove, rename, or delete anything unless separately approved.
8. Do not add broad match unless separately approved.

After applying, verify:

- Keywords were added.
- Negatives were added.
- Shared lists were updated.
- Shared lists are attached to the correct campaigns.
- No positive keyword is blocked by a new negative.

Then report:

```markdown
## Applied Changes

| Change | Status |
| --- | --- |

## Not Changed

List skipped, duplicate, blocked, or failed items.

## Warnings

List any remaining conflicts or follow-up risks.
```

## Actions Requiring Separate Approval

Never do these without separate, exact approval:

- Increase budget
- Change bidding strategy
- Enable a campaign, ad group, ad, or keyword
- Launch a campaign
- Pause a campaign, ad group, ad, or keyword
- Remove keywords
- Remove negatives
- Delete anything
- Add broad match keywords
- Apply Google auto recommendations
- Change conversion tracking
- Change final URLs or landing pages
- Change location targeting
- Change language targeting
- Change ad schedules
- Change device bid modifiers

## User Command Interpretation

| User Says | Agent Should Do |
| --- | --- |
| `Research keywords` | Research, group, and show recommendations. Do not apply. |
| `Research and apply` | Research, group, show the exact plan, ask approval, then apply only after approval. |
| `Add negatives` | Pull/search terms if needed, classify negatives, show levels, ask approval, then apply approved items. |
| `Clean this campaign` | Audit keywords, search terms, negatives, targeting, and recommendations. Do not apply until approved. |
| `Apply approved changes` | Apply only the previously approved changes, verify, and report. |

## Final Operating Principle

Research first. Group by intent. Separate positives from negatives. Choose the correct negative level. Show the plan. Ask approval. Apply through MCP. Verify. Report.

Never guess. Never add everything everywhere. Never spend money or reduce protections without approval.
