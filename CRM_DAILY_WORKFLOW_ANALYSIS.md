# EPF CRM: Daily Workflow & Usability Deep-Dive

## Current CRM Architecture Overview

The CRM is a sophisticated lead/project management system with:

- **Lead pipeline tracking** (New → Contacted → Estimate Sent → Won/Lost)
- **Project tracking** (Not Scheduled → Scheduled → In Progress → Completed)
- **Payment tracking** (No Invoice → Deposit Due → Balance Due → Paid)
- **Communication logging** (calls, texts, emails, notes with timeline)
- **Multi-user support** (Master/Limited access modes)
- **Cloud sync** (Cloudflare R2/Workers KV backend)
- **Advanced lead parsing** (converts voicemail/form text → structured data)
- **Automated reminders** (tracks overdue follow-ups, estimates without action)
- **Calendar integration** (Google Calendar + ICS download)
- **Template messaging** (personalized follow-up texts/emails)

---

## 🚨 **CRITICAL DAILY WORKFLOW ISSUES**

### 1. **Follow-Up Management is Fragmented**

**Problem:** Following up with leads requires multiple steps across tabs/tools.

**Current workflow:**

1. See "Follow-Ups Today" count on Dashboard
2. Switch to Clients tab
3. Find client with overdue `followUpDate`
4. Click "Follow Up" button
5. Choose message template (text/email)
6. Open separate dialog to send
7. Return to CRM to mark status

**Pain points:**

- No "quick send" from dashboard
- Can't batch send to multiple overdue leads
- No sent message history stored in CRM
- No automatic logging when message sent externally (SMS/email app)
- Calendar integration requires extra steps

**Recommendation:**

```javascript
// Create a dedicated Follow-Up Panel in Dashboard
<FollowUpPanel>
  <FollowUpToday clients={followUpsToday} />
  <QuickSendModal
    client={selectedClient}
    templates={followUpMessages}
    onSend={(message) => updateClient with logging}
  />
</FollowUpPanel>

// One-click send + auto-log:
function quickSendFollowUp(client, messageType) {
  // Generate message
  // Copy to clipboard (or send via SMS/email API)
  // Log to client timeline
  // Mark as contacted
  // Set next follow-up date
}
```

### 2. **Estimate → Invoice Workflow Disconnected**

**Problem:** Creating an invoice from an accepted estimate requires leaving CRM.

**Current flow:**

1. Client accepts estimate → set leadStatus = "Won"
2. Click "Create Invoice" button
3. Opens `/invoice-basic` with pre-filled client data
4. Build invoice from scratch or upload estimate
5. Return to CRM to manually mark `paymentStatus`
6. No two-way sync between invoice and CRM

**Pain points:**

- CRM doesn't know invoice was created
- Payment status must be updated manually
- Estimate amounts in CRM not linked to actual invoice lines
- No way to track estimate → invoice conversion rate
- Invoice PDF not linked in CRM timeline

**Recommendation:**

```javascript
// Bidirectional sync
// /app/api/crm/[clientId]/invoices
POST /api/crm/clients/{id}/invoices
  body: { estimateId, invoiceData }
  response: { invoiceId, previewUrl, paymentStatus }
  effect: Updates client.paymentStatus and logs in timeline

// Store invoice reference in CRM:
client.invoiceIds = ["inv-001", "inv-002"]
client.activeInvoiceId = "inv-002" // Current invoice
client.lastInvoiceDate = "2025-01-15"
client.totalInvoiced = 6400
```

### 3. **Real-Time Collaboration Lag**

**Problem:** Team members don't see each other's updates in real time.

**Current implementation:**

- 30-second polling interval for cloud sync
- No notification when another user updates a client
- Can edit same client simultaneously = last-write-wins conflict
- No conflict resolution or merge strategy

**Real-world scenario:**

- Alex marks "John Smith" as Contacted
- Yehor also has "John Smith" open, adds a note
- Alex refreshes → Yehor's note is gone

**Recommendation:**

```javascript
// Add presence + real-time sync
useEffect(() => {
  // Current: 30-second poll

  // Better: WebSocket or Server-Sent Events
  const eventSource = new EventSource(
    `/api/crm/sync?clientId=${selectedClientId}`,
  );
  eventSource.onmessage = (e) => {
    const update = JSON.parse(e.data);
    if (update.clientId === selectedClientId && !isOurChange) {
      // Merge incoming changes with local edits
      const merged = mergeUpdates(localForm, update.changes);
      setForm(merged);
      showNotification("John Smith was updated by Yehor");
    }
  };
}, [selectedClientId]);

// Operational transform or CRDT for conflict-free merges
function mergeUpdates(local, remote, field) {
  if (local[field]?.updatedAt >= remote[field]?.updatedAt) {
    return local[field]; // Keep local if more recent
  }
  return remote[field]; // Accept remote if newer
}
```

### 4. **Lead Input is Tedious for Phone Intake**

**Problem:** Taking a phone call = context switching to CRM, typing one-handed.

**Current options:**

- Manual entry (slow, error-prone on mobile)
- Paste voicemail transcription (requires parsing complex text)
- Paste website form (structured but still requires copy/paste)

**Scenario:**

- Client calls: "Hi, I'm John Smith from Toronto, I need popcorn removal for about 1200 sq ft"
- Alex has to:
  1. Open CRM (already open)
  2. Click "New Lead"
  3. Select "Voicemail" mode
  4. Paste transcription: "Hi this is John Smith calling from Toronto, I got popcorn in my kitchen living room and bedroom, maybe 1200 square feet total"
  5. AI/regex parses and fills fields
  6. Review and correct
  7. Save

**Pain points:**

- Parsing is sometimes wrong (regex-based)
- Still requires review + corrections
- No audio recording integration (just text)
- Mobile keyboard is small

**Recommendations:**

```javascript
// 1. Voice Recording in CRM
<VoiceRecorder
  onSave={(audioBlob) => {
    // Option A: Send to transcription API (Whisper, AssemblyAI)
    const transcript = await transcribeAudio(audioBlob);
    applyParsedLead(transcript, "voicemail");

    // Option B: Store audio + display transcript + human review
    client.callRecordingUrl = uploadToStorage(audioBlob);
    client.callTranscript = transcript;
  }}
/>

// 2. Smarter Parsing (use LLM instead of regex)
async function parseLeadText(text) {
  // Current: 20+ regex patterns, ~60% accuracy

  // Better: Call Claude/ChatGPT to structure:
  const response = await fetch("/api/crm/parse-lead", {
    method: "POST",
    body: JSON.stringify({ text, model: "claude-3.5-sonnet" })
  });
  return response.json(); // { name, phone, email, service, city, squareFootage, ... }
}

// 3. Quick-Add Widget (keyboard-first)
// Accessible from any page: Cmd/Ctrl+K → Type "new lead: John Smith, 416-555-0199, popcorn removal"
```

### 5. **Sales Pipeline Visibility is Poor**

**Problem:** No visual pipeline or conversion funnel view.

**Current views:**

- Dashboard: Cards with counts (New Leads: 3, Estimates Sent: 2, etc.)
- Clients tab: Filtered table list
- NO: Funnel chart, Kanban board, timeline

**What's missing:**

- Can't see which leads are stuck in "Follow-Up" stage
- No revenue funnel (leads → estimates → wins → revenue)
- Can't visualize how long deals take (New Lead → Won)
- No "velocity" metric (how many leads converted this month)

**Example analogy:**

- Dashboard shows: "3 new leads" but you don't know:
  - Are they distributed across team members?
  - Any assigned to someone who hasn't contacted them in 5 days?
  - What's the revenue potential? ($15k or $3k?)

**Recommendations:**

```javascript
// Create Pipeline Views:
1. KANBAN BOARD (sales-focused)
   New Leads | Contacted | Estimate Booked | Estimate Sent | Won | Lost
   [Card]   | [Card]    | [Card]          | [Card]        | ... | ...

   Each card shows: Name, Est. Amt, Days, Assignee
   Drag to move between stages

2. FUNNEL CHART (conversion)
   New Leads: 50 → 40 (-20%)
   Contacted: 40 → 25 (-37.5%)
   Estimate Sent: 25 → 18 (-28%)
   Won: 18 (+72%)

   Metric: "Average deal size: $6,400"

3. TIMELINE VIEW (schedule-focused)
   [Mon 1/20] John Smith - Follow-up due
   [Tue 1/21] Laura Lewis - Estimate sent
   [Wed 1/22] Mike Jones - Project completed
```

### 6. **Payment & Money Tracking is Incomplete**

**Problem:** CRM tracks payment STATUS but not actual payments, invoices, or profitability.

**Current fields:**

- `paymentStatus`: "Deposit Paid" / "Balance Due" / "Paid"
- `depositAmount`, `paymentAmount`, `balanceDue`, `estimateAmount`

**Missing features:**

- No reconciliation with actual invoices
- Can't see invoice history for a client
- No payment date tracking
- No tax/materials breakdown
- Can't see which invoices are overdue

**Example:**

- Client: "John Smith"
  - estimateAmount: $5,000
  - paymentStatus: "Paid"
  - paymentAmount: ??? (no field to verify)
  - balanceDue: ??? (unclear if $0 or something else)

**Recommendation:**

```javascript
// Enrich payment tracking:
client = {
  // Existing
  estimateAmount: "5000",
  paymentStatus: "Paid",

  // New: link to actual invoices
  invoices: [
    {
      id: "inv-001",
      amount: 3000,
      type: "deposit",
      date: "2025-01-10",
      status: "paid",
      paidDate: "2025-01-12",
      method: "e-Transfer"
    },
    {
      id: "inv-002",
      amount: 2000,
      type: "balance",
      date: "2025-01-20",
      status: "overdue",  // Created 20 days ago, unpaid
      dueDate: "2025-01-25",
      method: null
    }
  ],
  totalInvoiced: 5000,
  totalPaid: 3000,
  totalOverdue: 2000,
  lastPaymentDate: "2025-01-12"
}

// New API:
POST /api/crm/clients/{id}/payments
body: { invoiceId, amount, date, method, notes }
effect: Updates paymentStatus, adds to timeline, syncs to invoice
```

### 7. **Assigned To Team Member Routing Unclear**

**Problem:** CRM shows `assignedTo` but no clear workflow rules or visibility.

**Current behavior:**

- Master can see all clients
- Limited user (Yehor) sees only Calgary-area clients
- But when "Alex" creates a lead, both Alex and Yehor can see/edit it
- No assignment workflow (who's responsible for follow-up?)

**Questions without answers:**

- If Alex creates a lead but assigns it to Yehor, what happens when Alex takes a follow-up action?
- Can both users edit simultaneously?
- Who gets notified of changes?

**Recommendations:**

```javascript
// Define assignment rules:
1. OWNERSHIP: Only assigned user can edit (unless "viewing" mode)
2. COLLABORATION: Assignee owns status/dates, anyone can add notes
3. NOTIFICATIONS: Notify assignee when status changes (if not them)

// UI Changes:
<AssignmentPanel>
  <AssignTo options={teamMembers} current={client.assignedTo} />
  {client.assignedTo !== currentUser && (
    <p className="text-amber-600">
      ⚠️ This client is assigned to {client.assignedTo}.
      Your edits will create a note, not change primary status.
    </p>
  )}
</AssignmentPanel>
```

---

## 🔧 **DESIGN ISSUES IMPACTING DAILY USE**

### Issue 1: Dashboard Stats Don't Drive Action

**Current:**

```
New Leads: 3          Balance Due: $14,200
Follow-Ups Today: 2   Estimates Sent: 4
Won This Month: 1     Completed Jobs: 5
```

**Problem:** These are just numbers. User must click through to take action.

**Better:**

```
🔴 2 Follow-Ups Overdue (TODAY)
   → John Smith (3 days) - Called before? Needs text
   → Laura Lewis (1 day) - Estimate sent 2 weeks ago

🟡 $14,200 Balance Due
   → 3 invoices overdue (7, 12, 14 days)
   → Mike Jones: 12 days overdue on $5,000 balance

🟢 Quick Actions
   [+ New Lead] [📞 Call Log] [📧 Template] [📅 Schedule]
```

### Issue 2: Form Has Too Many Fields Visible at Once

**Current:** Add/Edit Client form shows ~25 fields on one scroll

**Problem:**

- Cognitive overload (which fields are required?)
- Mobile UX is terrible (too much scrolling)
- Same form for different workflows (new lead vs. edit project)

**Recommendation:** Progressive disclosure

```javascript
// Step 1: Quick capture (3 fields)
<Step1_QuickCapture>
  <Input label="Name or Phone" required />
  <Select label="Service?" options={workNeeded} />
  <Textarea label="Notes?" />
  <Button>Save & Continue</Button> {/* OR */} <Button>Save & Done</Button>
</Step1_QuickCapture>

// Step 2: Details (if user clicks Continue)
<Step2_Details>
  <Input label="Full Address" />
  <Input label="Square Footage" />
  <Select label="Ceiling Condition?" />
  <Input label="Requested Date" type="date" />
</Step2_Details>

// Step 3: Tracking (only if marking as Estimate Sent/Won)
<Step3_Tracking>
  <Select label="Lead Status?" />
  <Input label="Estimate Amount" />
  <Input label="Follow-up Date" type="date" />
</Step3_Tracking>
```

### Issue 3: Communication Log is Text-Only, Not Scannable

**Current:** Timeline shows chronological notes:

```
[Today 2:30pm] Added note: "Client called - wants to proceed"
[Today 1:15pm] Status changed: Lead status → Contacted
[Yesterday] Added note: "Left voicemail"
[3 days ago] Added note: "Initial inquiry from website"
```

**Problem:**

- Hard to find last contact date
- No visual distinction between different event types
- Can't filter to "show me only calls"

**Recommendation:**

```javascript
// Visual timeline with icons
[📞 Today 2:30pm] Contacted - "Client called - wants to proceed"
[↳ Status] Lead status → Contacted (by: Sales)
[☎️ Yesterday 10:00am] Call - "Left voicemail"
[📧 3 days ago] Lead Created - "Initial inquiry from website"

// Add filter buttons:
[All] [📞 Calls] [💬 Messages] [📝 Notes] [↳ Status Changes]

// Quick stats:
Last contacted: 2 days ago (call)
Contacted via: Phone + Email
Response rate: Never (0 replies)
```

### Issue 4: No Mobile-First Design

**Problem:** CRM is used on phone (in field), but not optimized for mobile.

**Current pain points:**

- Form fields too small to tap accurately
- Long dropdowns need scrolling
- No gestures (swipe to next client, etc.)
- Buttons require precision clicking
- No offline mode (sync only when online)

**Recommendation:**

```javascript
// Mobile-specific UI:
1. BIGGER TOUCH TARGETS (44px minimum)
2. PHONE-OPTIMIZED INPUT (tel: type, numeric keyboards)
3. SIMPLIFIED DASHBOARD (single column, card-based)
4. QUICK ACTIONS (floating button for common tasks)
5. OFFLINE QUEUE (save changes, sync when online)
6. PULL-TO-REFRESH (familiar mobile gesture)
7. BOTTOM SHEET MODALS (easier to reach on phone)

// Example mobile form:
<Mobile.Form>
  <Mobile.TextField
    label="Client Name"
    placeholder="e.g., John Smith"
    size="large"
    autoFocus
  />
  <Mobile.SelectField
    label="Service?"
    options={workNeeded}
    display="button-group" {/* visual tabs */}
  />
  <Mobile.TextField
    label="Phone"
    type="tel"
    keyboard="phone"
  />
  <Mobile.Actions sticky bottom>
    <Mobile.Button>Save & New</Mobile.Button>
    <Mobile.Button variant="secondary">Save & Close</Mobile.Button>
  </Mobile.Actions>
</Mobile.Form>
```

---

## 🎯 **QUICK WORKFLOW IMPROVEMENTS (Priority: High)**

### A. One-Click Follow-Up from Dashboard

```javascript
<Dashboard>
  <FollowUpToday>
    {followUpsToday.map((client) => (
      <QuickFollowUpCard key={client.id} client={client}>
        <p>
          {client.name} - {compactServiceLabel(client)}
        </p>
        <p className="text-sm text-slate-600">
          Follow-up due {formatDistance(client.followUpDate, today)}
        </p>

        {/* One-click actions */}
        <div className="flex gap-2">
          <button onClick={() => copyFollowUpText(client)}>💬 Copy Text</button>
          <button onClick={() => copyFollowUpEmail(client)}>
            📧 Copy Email
          </button>
          <button onClick={() => logCall(client)}>📞 Log Call</button>
        </div>
      </QuickFollowUpCard>
    ))}
  </FollowUpToday>
</Dashboard>
```

### B. Sales Pipeline Kanban View

```javascript
<PipelineKanban>
  <KanbanColumn status="New Lead">
    {newLeads.map((client) => (
      <DraggableCard
        client={client}
        onDropped={(newStatus) => {
          updateClient(client.id, { leadStatus: newStatus });
        }}
      />
    ))}
  </KanbanColumn>

  <KanbanColumn status="Contacted" />
  <KanbanColumn status="Estimate Sent" />
  <KanbanColumn status="Won" />
  <KanbanColumn status="Lost" />
</PipelineKanban>
```

### C. Estimate Amount Auto-Suggests Lead Status

```javascript
// Currently: User must manually change status to "Estimate Sent"

// Better: Auto-suggest when estimate filled
if (form.estimateAmount && !form.estimateSentAt) {
  showDialog({
    message: "Mark this as 'Estimate Sent'?",
    details: `Amount: ${money(form.estimateAmount)}`,
    actions: [
      {
        label: "Mark Estimate Sent",
        onClick: () => {
          form.leadStatus = "Estimate Sent";
          form.estimateSentAt = now;
          form.followUpDate = addDays(2);
        },
      },
      { label: "Keep as Draft", onClick: () => {} },
    ],
  });
}
```

### D. Store Last Contact Method & Date

```javascript
// Add to client object:
client.lastContact = {
  method: "call",  // call | text | email | visit
  date: "2025-01-15T14:30:00Z",
  by: "Alex",
  result: "appointment_booked"
}

// Display in client card:
<ClientCard client={client}>
  <p>Last contact: 3 days ago (via call)</p>
  <p className="text-xs">Alex booked an appointment</p>
</ClientCard>
```

### E. Create "Sales Dashboard" for Team Visibility

```javascript
<SalesDashboard>
  <section>
    <h2>Team Performance (This Month)</h2>
    <table>
      <tr>
        <th>Team Member</th>
        <th>New Leads</th>
        <th>Won</th>
        <th>Revenue</th>
        <th>Conversion %</th>
      </tr>
      <tr>
        <td>Alex</td>
        <td>12</td>
        <td>4</td>
        <td>$28,400</td>
        <td>33%</td>
      </tr>
      <tr>
        <td>Yehor</td>
        <td>8</td>
        <td>3</td>
        <td>$21,200</td>
        <td>37%</td>
      </tr>
    </table>
  </section>

  <section>
    <h2>By Service</h2>
    {/* chart showing Popcorn Removal vs. Painting vs. Drywall */}
  </section>
</SalesDashboard>
```

---

## 📊 **RECOMMENDED NEXT STEPS**

### Week 1: Quick Wins

- [ ] Add "Follow-Ups Today" quick action panel to Dashboard
- [ ] Implement one-click copy for follow-up messages
- [ ] Add last contact method/date to client cards
- [ ] Mobile button size fixes (44px minimum)

### Week 2: Pipeline Visibility

- [ ] Build Kanban board view (New → Contacted → Estimate Sent → Won)
- [ ] Add sales metrics dashboard (conversion %, revenue, team leaderboard)
- [ ] Create funnel chart

### Week 3: Messaging & Logging

- [ ] Integrate SMS/email sending (or at least copy-to-clipboard with auto-logging)
- [ ] Store sent message history in CRM timeline
- [ ] Auto-suggest status changes (e.g., if estimate filled → "Estimate Sent")

### Week 4: Data Integrity

- [ ] Link invoices to CRM clients
- [ ] Add two-way sync (invoice created → update CRM payment status)
- [ ] Track total invoiced, total paid, overdue amounts

### Longer-term: Real-Time Collab & AI

- [ ] WebSocket sync instead of polling
- [ ] LLM-based lead text parsing (instead of regex)
- [ ] Voice recording + transcription for calls
- [ ] Auto-generate follow-up suggestions

---

## Summary

The CRM is powerful but has **friction points** in daily workflows:

| Workflow           | Current Friction                                            | Impact                           |
| ------------------ | ----------------------------------------------------------- | -------------------------------- |
| Follow-up          | Multi-step (find lead → open modal → send externally → log) | Users skip logging, lose context |
| Sales pipeline     | No visual representation (only numbers)                     | Can't identify bottlenecks       |
| Estimate → Invoice | Manual status updates, no sync                              | Payment status often wrong       |
| Phone intake       | Requires context switch, small keyboard                     | Leads entered incorrectly        |
| Team collab        | 30-second polling, no notifications                         | Conflicts, duplicate work        |
| Mobile use         | Not optimized (small buttons, too much scrolling)           | Errors in field                  |

**Fix them** → CRM becomes a daily driver instead of occasional tool.
