import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CRM_KEY = "crm-clients.json";
const leadStatuses = ["New Lead", "Contacted", "Estimate Booked", "Estimate Sent", "Follow-Up", "Won", "Lost"];

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
        { error: "CRM_API_TOKEN is not configured for email tracking imports." },
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

function nowISO() {
  return new Date().toISOString();
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeEmail(value = "") {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (match?.[0] || "").trim().toLowerCase();
}

function emailList(value) {
  if (Array.isArray(value)) return value.map(normalizeEmail).filter(Boolean);
  return String(value || "")
    .split(/[,\s;]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function compactText(value = "", max = 900) {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function readClients(bucket) {
  const record = await bucket.get(CRM_KEY);
  if (!record) return [];
  const text = typeof record.text === "function" ? await record.text() : record;
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeClients(bucket, clients) {
  await bucket.put(CRM_KEY, JSON.stringify(clients), {
    httpMetadata: { contentType: "application/json" },
  });
}

function businessEmails() {
  return emailList(env("CRM_BUSINESS_EMAILS") || env("CRM_BUSINESS_EMAIL") || env("NEXT_PUBLIC_CRM_BUSINESS_EMAIL"));
}

function inferDirection(payload = {}) {
  const explicit = String(payload.direction || payload.eventType || "").toLowerCase();
  if (explicit.includes("sent") || explicit.includes("outbound")) return "outbound";
  if (explicit.includes("reply") || explicit.includes("inbound") || explicit.includes("received")) return "inbound";

  const from = normalizeEmail(payload.from || payload.sender);
  if (from && businessEmails().includes(from)) return "outbound";
  return "inbound";
}

function clientEmailSet(client = {}) {
  return new Set(emailList([client.email, client.contactEmail, client.billingEmail].filter(Boolean).join(",")));
}

function findClient(clients, payload, direction) {
  const clientId = String(payload.clientId || "").trim();
  if (clientId) {
    const byId = clients.find((client) => String(client.id) === clientId);
    if (byId) return byId;
  }

  const from = normalizeEmail(payload.from || payload.sender);
  const recipients = [
    ...emailList(payload.to),
    ...emailList(payload.cc),
    ...emailList(payload.bcc),
    ...emailList(payload.recipient),
    ...emailList(payload.clientEmail || payload.customerEmail),
  ];
  const clientSideEmails = direction === "outbound" ? recipients : [from, ...emailList(payload.replyTo)];
  const emailNeedles = new Set(clientSideEmails.filter(Boolean));

  if (emailNeedles.size) {
    const byEmail = clients.find((client) => {
      const emails = clientEmailSet(client);
      return [...emailNeedles].some((email) => emails.has(email));
    });
    if (byEmail) return byEmail;
  }

  const subject = String(payload.subject || "").toLowerCase();
  const nameNeedle = String(payload.clientName || payload.customerName || "").toLowerCase();
  if (!subject && !nameNeedle) return null;

  return clients.find((client) => {
    const name = String(client.name || "").toLowerCase();
    const address = String(client.address || "").toLowerCase();
    return Boolean(
      (name && (subject.includes(name) || nameNeedle.includes(name))) ||
        (address && subject.includes(address))
    );
  }) || null;
}

function createClientFromEmail(payload, direction) {
  const from = normalizeEmail(payload.from || payload.sender);
  const recipients = emailList(payload.to);
  const email = direction === "inbound" ? from : recipients.find((item) => !businessEmails().includes(item)) || "";
  const name = payload.clientName || payload.customerName || payload.fromName || email.split("@")[0] || "Email lead";

  return {
    id: makeId(),
    name,
    phone: "",
    email,
    address: "",
    city: "",
    service: "",
    source: "email",
    assignedTo: "",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    deletedAt: "",
    leadStatus: "New Lead",
    projectStatus: "Not Scheduled",
    paymentStatus: "No Invoice",
    communicationLog: [],
  };
}

function hasEmailLogged(client = {}, messageId = "") {
  if (!messageId) return false;
  const expectedId = `email-${messageId}`;
  return (client.communicationLog || []).some(
    (entry) => entry.id === expectedId || entry.sourceMessageId === messageId
  );
}

function emailTimelineEntry(payload, direction) {
  const messageId = String(payload.messageId || payload.id || payload.internetMessageId || "").trim();
  const subject = String(payload.subject || "(no subject)").trim();
  const body = compactText(payload.snippet || payload.text || payload.body || payload.html || "");
  const from = normalizeEmail(payload.from || payload.sender);
  const to = emailList(payload.to).join(", ");
  const date = payload.date || payload.sentAt || payload.receivedAt || nowISO();
  const label = direction === "outbound" ? `Email sent to ${to || "client"}` : `Email reply from ${from || "client"}`;

  return {
    id: messageId ? `email-${messageId}` : makeId(),
    sourceMessageId: messageId,
    date,
    type: "email",
    direction,
    content: [label, `Subject: ${subject}`, body].filter(Boolean).join("\n"),
    createdBy: "Email Sync",
  };
}

function nextLeadStatus(client = {}, direction) {
  if (["Won", "Lost"].includes(client.leadStatus)) return client.leadStatus;
  if (direction === "inbound") return "Contacted";
  return leadStatuses.includes(client.leadStatus) && client.leadStatus !== "New Lead"
    ? client.leadStatus
    : "Contacted";
}

export async function POST(req) {
  const auth = authorize(req);
  if (!auth.ok) return auth.response;

  const bucket = await getStorageBinding();
  if (!bucket) {
    return NextResponse.json({ error: "CRM_BUCKET is not configured." }, { status: 500 });
  }

  let payload = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const direction = inferDirection(payload);
  const entry = emailTimelineEntry(payload, direction);

  try {
    const clients = await readClients(bucket);
    let client = findClient(clients, payload, direction);
    let nextClients = clients;

    if (!client && payload.createIfMissing) {
      client = createClientFromEmail(payload, direction);
      nextClients = [client, ...clients];
    }

    if (!client) {
      return NextResponse.json({ error: "No matching client found." }, { status: 404 });
    }

    if (hasEmailLogged(client, entry.sourceMessageId)) {
      return NextResponse.json({ ok: true, duplicate: true, clientId: client.id });
    }

    nextClients = nextClients.map((item) => {
      if (item.id !== client.id) return item;

      const existingNotes = item.notes || item.projectNotes || "";
      const updateNote = payload.addToNotes
        ? [existingNotes, `[${String(entry.date).slice(0, 10)}] ${entry.content}`].filter(Boolean).join("\n\n")
        : existingNotes;

      return {
        ...item,
        email: item.email || (direction === "inbound" ? normalizeEmail(payload.from || payload.sender) : item.email),
        leadStatus: nextLeadStatus(item, direction),
        followUpDate: direction === "inbound" && item.followUpDate ? "" : item.followUpDate || "",
        notes: updateNote,
        updatedAt: nowISO(),
        communicationLog: [entry, ...(Array.isArray(item.communicationLog) ? item.communicationLog : [])],
      };
    });

    await writeClients(bucket, nextClients);
    return NextResponse.json({ ok: true, clientId: client.id, direction, entry });
  } catch (err) {
    console.warn("CRM email sync failed", err);
    return NextResponse.json({ error: "Failed to sync email into CRM." }, { status: 500 });
  }
}
