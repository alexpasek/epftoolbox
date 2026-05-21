# CRM Design Improvements for Daily Use

## Purpose

This document turns the CRM improvement notes into an implementation guide for the current `app/crm/page.jsx` experience. The goal is not a full redesign. The goal is to make daily sales work faster on mobile, make urgent work obvious, and reduce manual CRM cleanup after follow-ups, estimates, invoices, and payments.

## Current Baseline

The CRM already has:

- Dashboard, Pipeline, Clients, Calendar, and Invoices views.
- Mobile-safe viewport/layout work, including safe-area bottom navigation and `100dvh` overlays.
- A pipeline board by lead status.
- Follow-up message templates with calendar, SMS, and email handoff.
- Timeline logging for calls, texts, emails, notes, estimates, invoices, and status changes.
- Cloud sync through `/api/crm` with 30-second polling.
- Estimate and invoice handoffs to `/estimate-builder` and `/invoice-basic`.
- Invoice reconciliation from saved invoice records back into the CRM.
- Dashboard pipeline health and ownership summaries.

The remaining design work should focus on making these capabilities easier to operate, not duplicating them.

## Priority 1: Action-First Dashboard

### Problem

The dashboard still mixes metrics and tasks. A user opening the CRM in the morning should immediately know:

- Who must be contacted now.
- Which estimates are stale.
- Which invoices or balances need action.
- Which team member owns each urgent item.

### Target Experience

Put the dashboard in this order:

1. Immediate Action
2. My Tasks
3. Pipeline Health
4. Ownership
5. General stats

### Implementation Details

- Add an `ImmediateActionPanel` above the current stat cards.
- Group critical items:
  - Overdue follow-ups.
  - New leads older than one day.
  - Estimate Sent records with no action after two days.
  - Balance Due or completed unpaid jobs.
- Each row should include:
  - Client name, service/city, owner, and reason.
  - Primary actions: Call, Text, Follow Up, Open.
  - A visible age indicator such as `2d overdue`.
- Add filter shortcuts by setting existing `activeView`, `filters`, and `search` state instead of creating a separate task system.

### Acceptance Criteria

- A user can open the dashboard and contact the top overdue client without going to Clients first.
- The top section shows nothing when there are no urgent items.
- Dashboard remains readable on 375px iPhone width.
- No new storage schema is required for this step.

## Priority 2: Follow-Up Workflow

### Problem

Follow-ups are still fragmented because the browser can only open the SMS or email app. It cannot confirm a message was actually sent unless a real messaging provider is added.

### Target Experience

Make the current handoff explicit and reduce manual logging:

- "Text + Log" opens SMS and immediately logs the selected template.
- "Email + Log" opens mailto and immediately logs the selected template.
- "Calendar Only" creates the follow-up event without changing communication status.
- "Copy Message" copies the generated text for manual sending.

### Implementation Details

- Split `scheduleFollowUp` actions into explicit actions:
  - `calendar`
  - `textLog`
  - `emailLog`
  - `copy`
- Keep the timeline entry, but make the wording accurate:
  - "SMS handoff opened with template" rather than "sent" unless a provider confirms delivery.
- Add `navigator.clipboard.writeText` fallback with an alert if unavailable.
- In `FollowUpChooser`, show two clear template cards and a compact action grid under each.

### Acceptance Criteria

- One tap from a follow-up card logs the intended follow-up and opens SMS/email.
- Timeline wording does not claim confirmed delivery.
- Long-press calendar behavior remains available or is replaced by visible buttons.

## Priority 3: Estimate to Invoice Flow

### Current Status

The CRM now supports an `Accept + Invoice` action and invoice reconciliation from saved invoices. This is a strong first step, but the user still needs clearer UI around invoice state.

### Target Experience

When an estimate is accepted:

- CRM marks the client as `Won`.
- CRM sets `paymentStatus` to `Balance Due` unless already paid.
- CRM opens invoice creation with client and amount prefilled.
- The client detail view shows linked invoices and balance exposure.

### Next Improvements

- Add an "Accepted" action in estimate-specific UI, not only in the daily action grid.
- Add an invoice status panel in Client Detail:
  - Latest invoice link.
  - Total invoiced.
  - Paid amount.
  - Balance due.
  - Last invoice save date.
- Add a "Mark Deposit Paid" quick action.
- Add a "Mark Balance Paid" quick action that sets payment amount and clears balance.

### Acceptance Criteria

- A won estimate can become an invoice without manually setting payment fields first.
- Linked invoices are visible from both Client Detail and Invoices view.
- Payment status is derived from invoice/payment values where possible.

## Priority 4: Client Cards

### Problem

Client cards carry a lot of information. On mobile, all clients can look equally important unless warnings and next actions dominate the card.

### Target Experience

Each card should answer:

- Who is this?
- What stage are they in?
- What is the next action?
- Is anything overdue or unpaid?

### Implementation Details

- Keep the current mobile-safe action grid.
- Make warning banners more specific:
  - `Follow-up 2 days overdue`
  - `Estimate waiting 5 days`
  - `Completed job unpaid`
  - `Won job not scheduled`
- Increase status prominence without turning the card into a color-heavy layout.
- Keep primary actions visible:
  - Call
  - Text
  - Estimate or Accept + Invoice depending on lead stage
  - Follow Up
  - Open
- Keep destructive actions inside More.

### Acceptance Criteria

- Overdue and unpaid clients are visually distinguishable while scanning.
- No action row overflows on 375px width.
- Delete remains hidden behind More and password protection.

## Priority 5: Pipeline Visibility

### Current Status

The app has a lead-status pipeline board and dashboard pipeline health metrics.

### Target Experience

Pipeline should help answer:

- Where are leads stuck?
- How much value is in each stage?
- Which estimates need action?

### Implementation Details

- Add stage totals to each pipeline column:
  - Count.
  - Total estimate value.
  - Overdue count.
- On mobile, add a stage selector above the board so users can jump directly to a stage.
- Keep dropdown-based stage movement for now. Drag-and-drop is not required and adds risk on mobile.
- Add a stale-estimate highlight for `Estimate Sent` cards with no action after two days.

### Acceptance Criteria

- Each pipeline stage shows count and value.
- Mobile users can switch stage without horizontal scrolling through every column.
- Existing `changeStatus` behavior is reused.

## Priority 6: Phone Intake

### Problem

Manual phone intake is still slow on mobile. Regex parsing helps, but it will miss natural speech patterns.

### Target Experience

Make phone intake fast even before adding transcription:

- One-tap `Quick Phone Lead`.
- Big fields for Phone, Name, City, Service, Notes.
- Save button always reachable.
- Optional `Parse Notes` action for pasted voicemail text.

### Implementation Details

- Improve the existing phone mode layout before adding audio recording.
- Add common service chips:
  - Popcorn removal.
  - Drywall repair.
  - Drywall installation.
  - Painting.
  - Wallpaper removal.
- Add city chips for common areas.
- Keep regex parsing as fallback.
- Optional future: wire `/api/crm/assistant` or a dedicated parse endpoint for LLM extraction when `OPENAI_API_KEY` is configured.

### Acceptance Criteria

- A lead with phone, name, city, and service can be saved in under 30 seconds on iPhone.
- Phone mode does not require opening advanced fields.
- No required field depends on AI.

## Priority 7: Collaboration and Ownership

### Problem

The current system polls every 30 seconds and resolves conflicts by latest `updatedAt`. This is acceptable for light use but risky for simultaneous editing.

### Short-Term Improvements

- Show clearer ownership in Client Detail:
  - Assigned person.
  - Last updated time.
  - Last timeline actor.
- Warn when a client changed while its detail drawer or edit form is open.
- Add a manual "Refresh now" action in the header mobile More menu.

### Longer-Term Infrastructure

Real-time collaboration requires a backend change:

- Server-Sent Events or WebSockets for updates.
- Per-client revision numbers.
- Conflict detection on write.
- Field-level merge for non-conflicting edits.
- User identity beyond the current master/limited PIN.

### Acceptance Criteria for Short Term

- Users can see who owns a client.
- Users can see when a record was last changed.
- The app warns before silently overwriting a newer remote update.

## Priority 8: Payment Tracking

### Current Status

Payment status is tracked, and saved invoice records can be linked back to clients.

### Next Improvements

- Add first-class `invoiceIds` in the CRM schema instead of relying only on `estimateIds` and `crmClientId`.
- Add derived payment fields:
  - `totalInvoiced`
  - `totalPaid`
  - `balanceDue`
  - `latestInvoiceId`
- In the Invoices view, separate:
  - Needs invoice.
  - Invoice sent.
  - Deposit due.
  - Balance due.
  - Paid.

### Acceptance Criteria

- CRM balance due matches linked invoice totals minus recorded payments.
- A user can open the latest invoice from the client card or detail drawer.
- Paid clients no longer appear in balance due lists.

## Design Rules

- Keep CRM screens dense but readable. This is an operations tool, not a marketing page.
- Use restrained status colors. Avoid turning full cards red/yellow unless the item is genuinely urgent.
- Use 44px minimum touch targets on mobile.
- Do not hide primary work actions behind menus.
- Keep destructive actions behind confirmation and away from primary button rows.
- Prefer explicit labels over icons-only controls unless the icon is universally clear.
- Avoid drag-and-drop until the current tap/select workflow is fully optimized.

## Implementation Order

1. Immediate Action dashboard panel.
2. Follow-up action split: calendar, text log, email log, copy.
3. Client card warning text and stage-aware primary actions.
4. Pipeline stage selector and stage totals.
5. Phone intake chips and simplified quick form.
6. Client detail ownership and last-updated context.
7. Payment view grouping and explicit invoice fields.
8. Real-time collaboration backend design.

## Non-Goals for the Next Patch

- True SMS/email delivery confirmation without Twilio, SendGrid, Gmail, or Microsoft Graph.
- Real-time multi-user collaboration without backend transport and revisions.
- Drag-and-drop Kanban on mobile.
- Large component extraction while workflow behavior is still changing.

## Success Metrics

- A user can process all overdue follow-ups from the dashboard.
- A user can accept an estimate and start an invoice from the client detail drawer.
- A user can understand pipeline value and blocked stages without opening Clients.
- A phone lead can be entered one-handed on iPhone.
- Invoice balances visible in CRM match saved invoice records.
