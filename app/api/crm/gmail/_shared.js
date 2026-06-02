const CRM_KEY = "crm-clients.json";
const GMAIL_KEY = "gmail-connection.json";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const leadStatuses = ["New Lead", "Contacted", "Estimate Booked", "Estimate Sent", "Follow-Up", "Won", "Lost"];

export function env(name) {
  try {
    return process.env[name] || "";
  } catch {
    return "";
  }
}

export function nowISO() {
  return new Date().toISOString();
}

export function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getStorageBinding() {
  if (typeof globalThis.CRM_BUCKET !== "undefined") return globalThis.CRM_BUCKET;
  if (typeof globalThis.INVOICES_BUCKET !== "undefined") return globalThis.INVOICES_BUCKET;
  if (typeof globalThis.invoice2 !== "undefined") return globalThis.invoice2;

  try {
    return process.env.CRM_BUCKET || process.env.INVOICES_BUCKET || process.env.invoice2 || null;
  } catch {
    return null;
  }
}

export function getRedirectUri(req) {
  const configured = env("GOOGLE_GMAIL_REDIRECT_URI") || env("GMAIL_REDIRECT_URI");
  if (configured) return configured;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}/api/crm/gmail/callback`;
}

export function authorizeSetup(req) {
  const setupKey = env("GMAIL_SETUP_KEY");
  if (!setupKey) return { ok: true };
  const url = new URL(req.url);
  if (url.searchParams.get("setupKey") === setupKey) return { ok: true };
  return { ok: false, error: "Wrong or missing Gmail setup key." };
}

export function gmailOAuthState() {
  return env("GMAIL_OAUTH_STATE") || env("CRM_API_TOKEN") || "epf-crm-gmail";
}

export function gmailAuthUrl(req) {
  const clientId = env("GOOGLE_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: gmailOAuthState(),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function readJson(bucket, key, fallback) {
  const record = await bucket.get(key);
  if (!record) return fallback;
  const text = typeof record.text === "function" ? await record.text() : record;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export async function writeJson(bucket, key, value) {
  await bucket.put(key, JSON.stringify(value), {
    httpMetadata: { contentType: "application/json" },
  });
}

export async function readClients(bucket) {
  const clients = await readJson(bucket, CRM_KEY, []);
  return Array.isArray(clients) ? clients : [];
}

export async function writeClients(bucket, clients) {
  await writeJson(bucket, CRM_KEY, clients);
}

export async function readGmailConnection(bucket) {
  return readJson(bucket, GMAIL_KEY, null);
}

export async function writeGmailConnection(bucket, connection) {
  await writeJson(bucket, GMAIL_KEY, connection);
}

export async function exchangeCodeForTokens(req, code) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getRedirectUri(req),
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || "Gmail token exchange failed");
  if (!data.refresh_token) {
    throw new Error("Google did not return a refresh token. Reconnect Gmail and approve offline access.");
  }
  return data;
}

export async function refreshAccessToken(connection) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      refresh_token: connection.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || "Gmail token refresh failed");
  return {
    ...connection,
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 - 60000,
    updatedAt: nowISO(),
  };
}

export async function validAccessConnection(bucket, connection) {
  if (!connection?.refreshToken) throw new Error("Gmail is not connected.");
  if (connection.accessToken && Number(connection.expiresAt || 0) > Date.now()) return connection;
  const refreshed = await refreshAccessToken(connection);
  await writeGmailConnection(bucket, refreshed);
  return refreshed;
}

export async function gmailFetch(connection, path, options = {}) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gmail API request failed");
  return data;
}

export function normalizeEmail(value = "") {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (match?.[0] || "").trim().toLowerCase();
}

export function emailList(value) {
  if (Array.isArray(value)) return value.map(normalizeEmail).filter(Boolean);
  return String(value || "")
    .split(/[,\s;]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function headerValue(message, name) {
  const header = (message.payload?.headers || []).find((item) => String(item.name || "").toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

export function messagePayload(message = {}, direction, profileEmail = "") {
  const from = normalizeEmail(headerValue(message, "From"));
  const to = emailList(headerValue(message, "To"));
  const cc = emailList(headerValue(message, "Cc"));
  const dateHeader = headerValue(message, "Date");
  const internalDate = Number(message.internalDate || 0);
  const headerDate = dateHeader ? new Date(dateHeader) : null;
  const date = headerDate && Number.isFinite(headerDate.getTime())
    ? headerDate.toISOString()
    : internalDate
      ? new Date(internalDate).toISOString()
      : nowISO();
  const subject = headerValue(message, "Subject") || "(no subject)";
  const body = String(message.snippet || "").replace(/\s+/g, " ").trim();
  const label = direction === "outbound" ? `Email sent to ${to.join(", ") || "client"}` : `Email reply from ${from || "client"}`;

  return {
    id: `gmail-${message.id}`,
    sourceMessageId: message.id,
    threadId: message.threadId || "",
    date,
    type: "email",
    direction,
    content: [label, `Subject: ${subject}`, body].filter(Boolean).join("\n"),
    createdBy: "Gmail Sync",
    from,
    to,
    cc,
    subject,
    profileEmail,
  };
}

function clientEmailSet(client = {}) {
  return new Set(emailList([client.email, client.contactEmail, client.billingEmail].filter(Boolean).join(",")));
}

export function findClientForMessage(clients, payload, direction) {
  const profile = normalizeEmail(payload.profileEmail);
  const clientSideEmails = direction === "outbound"
    ? [...payload.to, ...payload.cc].filter((email) => email !== profile)
    : [payload.from, ...payload.cc].filter((email) => email !== profile);
  const needles = new Set(clientSideEmails.filter(Boolean));

  if (needles.size) {
    const byEmail = clients.find((client) => {
      const emails = clientEmailSet(client);
      return [...needles].some((email) => emails.has(email));
    });
    if (byEmail) return byEmail;
  }

  const subject = String(payload.subject || "").toLowerCase();
  return clients.find((client) => {
    const name = String(client.name || "").toLowerCase();
    const address = String(client.address || "").toLowerCase();
    return Boolean((name && subject.includes(name)) || (address && subject.includes(address)));
  }) || null;
}

function hasMessageLogged(client = {}, messageId = "") {
  return (client.communicationLog || []).some(
    (entry) => entry.id === `gmail-${messageId}` || entry.sourceMessageId === messageId
  );
}

function nextLeadStatus(client = {}, direction) {
  if (["Won", "Lost"].includes(client.leadStatus)) return client.leadStatus;
  if (direction === "inbound") return "Contacted";
  return leadStatuses.includes(client.leadStatus) && client.leadStatus !== "New Lead"
    ? client.leadStatus
    : "Contacted";
}

export function applyGmailEntriesToClients(clients, entries) {
  let changed = false;
  const syncAt = nowISO();
  const nextClients = clients.map((client) => {
    const matchedEntries = entries.filter((entry) => {
      const matchedClient = findClientForMessage([client], entry, entry.direction);
      return matchedClient?.id === client.id;
    });
    const clientEntries = matchedEntries.filter((entry) => !hasMessageLogged(client, entry.sourceMessageId));
    if (!matchedEntries.length) return client;
    if (!clientEntries.length) return client;
    changed = true;
    const newestInbound = clientEntries.some((entry) => entry.direction === "inbound");

    return {
      ...client,
      leadStatus: newestInbound ? "Contacted" : nextLeadStatus(client, "outbound"),
      followUpDate: newestInbound && client.followUpDate ? "" : client.followUpDate || "",
      updatedAt: syncAt,
      communicationLog: [...clientEntries, ...(Array.isArray(client.communicationLog) ? client.communicationLog : [])],
    };
  });

  return { clients: nextClients, changed };
}

export function summarizeConnection(connection) {
  if (!connection) return { connected: false };
  return {
    connected: true,
    email: connection.email || "",
    lastSyncAt: connection.lastSyncAt || "",
    lastHistoryId: connection.lastHistoryId || "",
  };
}
