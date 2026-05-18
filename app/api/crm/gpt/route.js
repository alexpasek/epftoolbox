import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CRM_KEY = "crm-clients.json";
const CRM_SCHEMA_VERSION = 2;

const leadStatuses = [
  "New Lead",
  "Contacted",
  "Estimate Booked",
  "Estimate Sent",
  "Follow-Up",
  "Won",
  "Lost",
];

const projectStatuses = ["Not Scheduled", "Scheduled", "In Progress", "Completed"];
const paymentStatuses = ["No Invoice", "Deposit Due", "Deposit Paid", "Balance Due", "Paid"];
const sources = ["phone", "email", "website", "referral", "manual", "paste", "voicemail"];

const allowedFields = [
  "name",
  "phone",
  "email",
  "address",
  "city",
  "service",
  "source",
  "assignedTo",
  "leadStatus",
  "projectStatus",
  "paymentStatus",
  "estimateAmount",
  "estimateDate",
  "followUpDate",
  "requestedDate",
  "squareFootage",
  "workNeeded",
  "ceilingHeight",
  "asbestosStatus",
  "depositAmount",
  "paymentAmount",
  "balanceDue",
  "paymentMethod",
  "notes",
];

const cityKeywords = [
  "Toronto",
  "Mississauga",
  "Brampton",
  "Oakville",
  "Burlington",
  "Hamilton",
  "Milton",
  "Etobicoke",
  "Scarborough",
  "North York",
  "Vaughan",
  "Markham",
  "Richmond Hill",
  "Calgary",
  "Airdrie",
  "Chestermere",
  "Cochrane",
];

const serviceKeywords = [
  ["popcorn removed", "Popcorn Ceiling Removal"],
  ["popcorn removal", "Popcorn Ceiling Removal"],
  ["popcorn ceiling removal", "Popcorn Ceiling Removal"],
  ["popcorn ceiling", "Popcorn Ceiling Removal"],
  ["skim coat", "Ceiling skim coat"],
  ["skimmed", "Ceiling skim coat"],
  ["ceiling repair", "Ceiling Repair"],
  ["painting", "Painting"],
  ["drywall", "Drywall"],
  ["wallpaper removal", "Wallpaper Removal"],
  ["baseboards", "Baseboards"],
  ["pot lights", "Pot Lights"],
];

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nowISO = () => new Date().toISOString();

function addDaysISO(days, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function env(name) {
  try {
    return process.env[name] || "";
  } catch {
    return "";
  }
}

function getAuthToken(req) {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-crm-api-key") || "";
}

function authorize(req) {
  const expected = env("CRM_API_TOKEN");
  if (!expected) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "CRM_API_TOKEN is not configured for external CRM writes." },
        { status: 501 }
      ),
    };
  }

  if (getAuthToken(req) !== expected) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true };
}

async function getStorageBinding() {
  if (typeof globalThis.CRM_BUCKET !== "undefined") return globalThis.CRM_BUCKET;
  if (typeof globalThis.INVOICES_BUCKET !== "undefined") return globalThis.INVOICES_BUCKET;
  if (typeof globalThis.invoice2 !== "undefined") return globalThis.invoice2;

  try {
    return process.env.CRM_BUCKET || process.env.INVOICES_BUCKET || process.env.invoice2 || null;
  } catch {
    return null;
  }
}

async function readClients() {
  const storage = await getStorageBinding();
  if (!storage) return null;

  try {
    const record = await storage.get(CRM_KEY);
    if (!record) return [];

    const text = typeof record.text === "function" ? await record.text() : record;
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("CRM GPT storage read failed", err);
    return null;
  }
}

async function writeClients(clients) {
  const storage = await getStorageBinding();
  if (!storage) return false;

  try {
    const body = JSON.stringify(clients);
    if (storage.put.length >= 3) {
      await storage.put(CRM_KEY, body, {
        httpMetadata: { contentType: "application/json" },
      });
    } else {
      await storage.put(CRM_KEY, body);
    }
    return true;
  } catch (err) {
    console.warn("CRM GPT storage write failed", err);
    return false;
  }
}

function recordTime(client) {
  const value = client?.deletedAt || client?.updatedAt || client?.createdAt || "";
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function mergeClients(existing, incoming) {
  const byId = new Map();

  [...existing, ...incoming].forEach((client) => {
    if (!client?.id) return;
    const previous = byId.get(client.id);
    if (!previous || recordTime(client) >= recordTime(previous)) {
      byId.set(client.id, client);
    }
  });

  return [...byId.values()].sort((a, b) => recordTime(b) - recordTime(a));
}

function searchableText(client = {}) {
  return [
    client.id,
    client.name,
    client.phone,
    client.email,
    client.address,
    client.city,
    client.service,
    client.source,
    client.assignedTo,
    client.leadStatus,
    client.projectStatus,
    client.paymentStatus,
    client.notes,
    ...(client.communicationLog || []).map((entry) => entry.content),
  ]
    .join(" ")
    .toLowerCase();
}

function summarizeClient(client = {}) {
  return {
    id: client.id || "",
    name: client.name || "",
    phone: client.phone || "",
    email: client.email || "",
    address: client.address || "",
    city: client.city || "",
    service: client.service || "",
    source: client.source || "",
    assignedTo: client.assignedTo || "",
    leadStatus: client.leadStatus || "",
    projectStatus: client.projectStatus || "",
    paymentStatus: client.paymentStatus || "",
    estimateAmount: client.estimateAmount || "",
    estimateDate: client.estimateDate || "",
    followUpDate: client.followUpDate || "",
    requestedDate: client.requestedDate || "",
    squareFootage: client.squareFootage || "",
    workNeeded: client.workNeeded || "",
    depositAmount: client.depositAmount || "",
    paymentAmount: client.paymentAmount || "",
    balanceDue: client.balanceDue || "",
    paymentMethod: client.paymentMethod || "",
    notes: client.notes || "",
    deletedAt: client.deletedAt || "",
    createdAt: client.createdAt || "",
    updatedAt: client.updatedAt || "",
  };
}

function findClientIndex(clients = [], { id = "", targetName = "" } = {}) {
  if (id) {
    const index = clients.findIndex((client) => String(client.id) === String(id));
    if (index >= 0) return index;
  }

  const name = String(targetName || "").trim().toLowerCase();
  if (!name) return -1;
  return clients.findIndex((client) => String(client.name || "").trim().toLowerCase() === name);
}

function normalizePhone(value = "") {
  const match = String(value).match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  return match?.[0]?.trim() || "";
}

function extractLabeledValue(text, labels) {
  for (const label of labels) {
    const match = text.match(new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im"));
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function extractLabeledBlock(text, labels) {
  const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`^\\s*(?:${labelPattern})\\s*:\\s*([\\s\\S]*?)(?=^\\s*[A-Za-z][A-Za-z /-]{0,30}\\s*:|\\s*$)`, "im"));
  return match?.[1]?.trim() || "";
}

function cleanName(value = "") {
  return String(value)
    .replace(/\b(phone|email|city|service|message|looking|need|needs|for)\b.*$/i, "")
    .replace(/[^a-zA-Z' -]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(" ");
}

function detectService(text = "") {
  const lower = String(text || "").toLowerCase();
  if (/\bpopcorn\b/.test(lower) && /\b(remov(?:e|ed|al|ing)?|scrap(?:e|ed|ing)?)\b/.test(lower)) {
    return "Popcorn Ceiling Removal";
  }
  return serviceKeywords.find(([keyword]) => lower.includes(keyword))?.[1] || "";
}

function parseLeadText(inputText = "", source = "gpt") {
  const text = String(inputText || "").trim();
  const lower = text.toLowerCase();
  const details = extractLabeledBlock(text, ["Details", "Message", "Notes", "Project", "Scope", "Description"]);
  const labeledPhone = normalizePhone(extractLabeledValue(text, ["Phone", "Tel", "Telephone", "Mobile", "Cell"]));
  const labeledName = extractLabeledValue(text, ["Name", "From", "Client", "Customer"]);
  const spokenName =
    text.match(/\b(?:hi[, ]+)?(?:this is|my name is|i am|i'm)\s+([a-zA-Z][a-zA-Z' -]{1,45})/i)?.[1] ||
    "";

  const city =
    extractLabeledValue(text, ["City", "Town", "Area", "Neighbourhood", "Neighborhood"]) ||
    cityKeywords.find((cityName) => lower.includes(cityName.toLowerCase())) ||
    "";
  const detectedService = detectService([details, text].filter(Boolean).join("\n"));

  return {
    name: cleanName(labeledName || spokenName),
    phone: labeledPhone || normalizePhone(text),
    email: (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0],
    address:
      extractLabeledValue(text, ["Address", "Site"]) ||
      text.match(/\b\d{1,6}\s+[a-zA-Z0-9' .-]+\s+(?:st|street|ave|avenue|road|rd|drive|dr|court|ct|crescent|cres|blvd|boulevard|lane|ln)\b/i)?.[0] ||
      "",
    city,
    service: extractLabeledValue(text, ["Service", "Work", "Job"]) || detectedService,
    workNeeded: detectedService,
    squareFootage:
      text.match(/\b\d{2,5}\s*(?:sq\.?\s*ft|sqft|square feet)\b/i)?.[0] ||
      text.match(/\b\d{1,3}\s*(?:x|by)\s*\d{1,3}\b/i)?.[0] ||
      "",
    requestedDate:
      text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ||
      text.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?\b/i)?.[0] ||
      text.match(/\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)?.[0] ||
      "",
    notes: text,
    source,
  };
}

function normalizeSource(value) {
  const source = String(value || "").toLowerCase();
  if (source.includes("voicemail")) return "voicemail";
  if (source.includes("paste")) return "paste";
  if (source.includes("phone") || source.includes("voice")) return "phone";
  if (source.includes("email")) return "email";
  if (source.includes("web") || source.includes("form")) return "website";
  if (source.includes("referral")) return "referral";
  if (source.includes("gpt") || source.includes("ai")) return "manual";
  return sources.includes(source) ? source : "manual";
}

function normalizeChoice(value, choices, fallback) {
  return choices.includes(value) ? value : fallback;
}

function makeTimelineEntry(content, type = "note", direction = "internal") {
  return {
    id: makeId(),
    date: nowISO(),
    type,
    direction,
    content,
    createdBy: "GPT API",
  };
}

function pickAllowedFields(input = {}) {
  return Object.fromEntries(
    allowedFields
      .filter((field) => Object.prototype.hasOwnProperty.call(input, field))
      .map((field) => [field, input[field] == null ? "" : String(input[field]).trim()])
  );
}

function normalizeUpdates(updates = {}) {
  const picked = pickAllowedFields(updates);
  if (Object.prototype.hasOwnProperty.call(picked, "source")) {
    picked.source = normalizeSource(picked.source);
  }
  if (Object.prototype.hasOwnProperty.call(picked, "leadStatus")) {
    picked.leadStatus = normalizeChoice(picked.leadStatus, leadStatuses, "");
    if (!picked.leadStatus) delete picked.leadStatus;
  }
  if (Object.prototype.hasOwnProperty.call(picked, "projectStatus")) {
    picked.projectStatus = normalizeChoice(picked.projectStatus, projectStatuses, "");
    if (!picked.projectStatus) delete picked.projectStatus;
  }
  if (Object.prototype.hasOwnProperty.call(picked, "paymentStatus")) {
    picked.paymentStatus = normalizeChoice(picked.paymentStatus, paymentStatuses, "");
    if (!picked.paymentStatus) delete picked.paymentStatus;
  }
  return picked;
}

function applyDerivedStatusFields(client = {}, updates = {}) {
  const next = { ...updates };
  if (updates.leadStatus === "Estimate Sent") {
    next.estimateSentAt = client.estimateSentAt || nowISO();
    next.followUpDate = updates.followUpDate || client.followUpDate || addDaysISO(2);
  }
  if (updates.leadStatus === "Won") {
    next.estimateAcceptedAt = client.estimateAcceptedAt || nowISO();
  }
  if (updates.leadStatus === "Lost") {
    next.followUpDate = "";
  }
  if (updates.projectStatus === "Completed") {
    next.completedDate = client.completedDate || nowISO().slice(0, 10);
  }
  if (updates.paymentStatus === "Paid") {
    next.balanceDue = "";
  }
  return next;
}

function createClient(payload = {}) {
  const textLead = typeof payload.leadText === "string" ? parseLeadText(payload.leadText, payload.source || "manual") : {};
  const lead = payload.lead && typeof payload.lead === "object" ? pickAllowedFields(payload.lead) : {};
  const flat = pickAllowedFields(payload);
  const merged = { ...textLead, ...flat, ...lead };
  const now = nowISO();
  const notes = [merged.notes, payload.leadText && !merged.notes ? payload.leadText : ""].filter(Boolean).join("\n\n");

  return {
    schemaVersion: CRM_SCHEMA_VERSION,
    id: payload.id || makeId(),
    name: merged.name || "",
    phone: merged.phone || "",
    email: merged.email || "",
    address: merged.address || "",
    city: merged.city || "",
    service: merged.service || "",
    source: normalizeSource(merged.source || "manual"),
    assignedTo: merged.assignedTo || "",
    createdAt: payload.createdAt || now,
    updatedAt: now,
    deletedAt: "",
    leadStatus: normalizeChoice(merged.leadStatus, leadStatuses, "New Lead"),
    projectStatus: normalizeChoice(merged.projectStatus, projectStatuses, "Not Scheduled"),
    paymentStatus: normalizeChoice(merged.paymentStatus, paymentStatuses, "No Invoice"),
    estimateAmount: merged.estimateAmount || "",
    estimateDate: merged.estimateDate || "",
    estimateSentAt: "",
    estimateAcceptedAt: "",
    estimateIds: [],
    squareFootage: merged.squareFootage || "",
    workNeeded: merged.workNeeded || "",
    popcornCondition: "unknown",
    ceilingHeight: merged.ceilingHeight || "",
    asbestosStatus: merged.asbestosStatus || "",
    startDate: "",
    completedDate: "",
    followUpDate: merged.followUpDate || "",
    requestedDate: merged.requestedDate || "",
    depositAmount: merged.depositAmount || "",
    paymentAmount: merged.paymentAmount || "",
    balanceDue: merged.balanceDue || "",
    paymentMethod: merged.paymentMethod || "",
    notes,
    communicationLog: [
      makeTimelineEntry(payload.leadText ? "Lead created from GPT lead text." : "Lead created from GPT API."),
    ],
  };
}

export async function POST(req) {
  const auth = authorize(req);
  if (!auth.ok) return auth.response;

  let payload = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const client = createClient(payload);
  if (!client.name && !client.phone && !client.email) {
    return NextResponse.json(
      { error: "Add at least one of name, phone, or email." },
      { status: 400 }
    );
  }

  const existing = await readClients();
  if (!existing) {
    return NextResponse.json(
      { error: "Failed to read CRM clients. Check the Cloudflare storage binding." },
      { status: 500 }
    );
  }

  const merged = mergeClients(existing, [client]);
  const ok = await writeClients(merged);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to save CRM client. Check the Cloudflare storage binding." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, client, count: merged.length });
}

export async function GET(req) {
  const auth = authorize(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const query = String(url.searchParams.get("q") || "").trim().toLowerCase();
  const includeDeleted = url.searchParams.get("includeDeleted") === "true";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25), 1), 100);

  const clients = await readClients();
  if (!clients) {
    return NextResponse.json(
      { error: "Failed to read CRM clients. Check the Cloudflare storage binding." },
      { status: 500 }
    );
  }

  const items = clients
    .filter((client) => includeDeleted || !client.deletedAt)
    .filter((client) => !query || searchableText(client).includes(query))
    .sort((a, b) => recordTime(b) - recordTime(a))
    .slice(0, limit)
    .map(summarizeClient);

  return NextResponse.json({ ok: true, count: items.length, items });
}

export async function PATCH(req) {
  const auth = authorize(req);
  if (!auth.ok) return auth.response;

  let payload = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clients = await readClients();
  if (!clients) {
    return NextResponse.json(
      { error: "Failed to read CRM clients. Check the Cloudflare storage binding." },
      { status: 500 }
    );
  }

  const index = findClientIndex(clients, payload);
  if (index < 0) {
    return NextResponse.json({ error: "Client not found. Use listCrmClients first to get the client id." }, { status: 404 });
  }

  const current = clients[index];
  const changes = normalizeUpdates(payload.changes || payload.lead || payload);
  delete changes.id;
  delete changes.targetName;
  delete changes.appendNote;
  delete changes.note;

  const note = String(payload.note || "").trim();
  const appendNote = Boolean(payload.appendNote || note);
  const nextNotes = appendNote && (note || changes.notes)
    ? [current.notes, note || changes.notes].filter(Boolean).join("\n\n")
    : changes.notes ?? current.notes;

  const derivedChanges = applyDerivedStatusFields(current, {
    ...changes,
    notes: nextNotes,
  });
  const updated = {
    ...current,
    ...derivedChanges,
    updatedAt: nowISO(),
    communicationLog: [
      makeTimelineEntry(
        note ? `GPT note: ${note}` : `GPT updated CRM fields: ${Object.keys(changes).join(", ") || "record"}`,
        note ? "note" : "status_change"
      ),
      ...(current.communicationLog || []),
    ],
  };

  const nextClients = [...clients];
  nextClients[index] = updated;
  const merged = mergeClients([], nextClients);
  const ok = await writeClients(merged);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to save CRM client. Check the Cloudflare storage binding." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, client: summarizeClient(updated), count: merged.length });
}

export async function DELETE(req) {
  const auth = authorize(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const id = String(url.searchParams.get("id") || "").trim();
  const targetName = String(url.searchParams.get("targetName") || "").trim();

  const clients = await readClients();
  if (!clients) {
    return NextResponse.json(
      { error: "Failed to read CRM clients. Check the Cloudflare storage binding." },
      { status: 500 }
    );
  }

  const index = findClientIndex(clients, { id, targetName });
  if (index < 0) {
    return NextResponse.json({ error: "Client not found. Use listCrmClients first to get the client id." }, { status: 404 });
  }

  const current = clients[index];
  const deleted = {
    ...current,
    deletedAt: current.deletedAt || nowISO(),
    updatedAt: nowISO(),
    communicationLog: [
      makeTimelineEntry("Client soft-deleted by GPT API.", "status_change"),
      ...(current.communicationLog || []),
    ],
  };
  const nextClients = [...clients];
  nextClients[index] = deleted;
  const merged = mergeClients([], nextClients);
  const ok = await writeClients(merged);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to delete CRM client. Check the Cloudflare storage binding." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, deleted: true, client: summarizeClient(deleted), count: merged.length });
}
