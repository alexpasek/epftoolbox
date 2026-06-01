import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CRM_KEY = "crm-clients.json";
const RECEIPT_PREFIX = "receipts";
const receiptCategories = ["Materials", "Tools", "Subcontractor", "Dump / Disposal", "Parking", "Fuel", "Other"];

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
        { error: "CRM_API_TOKEN is not configured for external receipt imports." },
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

function safePathPart(value = "") {
  return String(value || "file")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "file";
}

function parseDataUrl(dataUrl = "") {
  const match = String(dataUrl).match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1] || "application/octet-stream";
  const base64 = match[2] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return { contentType, bytes };
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

function findClient(clients, payload) {
  const clientId = String(payload.clientId || "").trim();
  if (clientId) {
    const byId = clients.find((client) => String(client.id) === clientId);
    if (byId) return byId;
  }

  const phone = String(payload.phone || "").replace(/\D/g, "");
  if (phone) {
    const byPhone = clients.find((client) => String(client.phone || "").replace(/\D/g, "").endsWith(phone.slice(-10)));
    if (byPhone) return byPhone;
  }

  const needle = [payload.clientName, payload.client, payload.emailSubject]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!needle) return null;
  return clients.find((client) => {
    const haystack = [client.name, client.address, client.city, client.service]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack && (needle.includes(haystack) || haystack.includes(needle));
  }) || null;
}

function publicUrlFor(req, key) {
  const url = new URL(req.url);
  url.pathname = "/api/crm/receipts";
  url.search = "";
  url.searchParams.set("key", key);
  return url.toString();
}

async function storeFile(req, bucket, clientId, receiptId, attachment = {}) {
  const parsed = parseDataUrl(attachment.fileData || attachment.data || "");
  if (!parsed) return {};
  const fileName = safePathPart(attachment.fileName || attachment.name || "emailed-receipt");
  const key = `${RECEIPT_PREFIX}/${safePathPart(clientId)}/${safePathPart(receiptId)}/${fileName}`;
  await bucket.put(key, parsed.bytes, {
    httpMetadata: {
      contentType: attachment.fileType || parsed.contentType,
      contentDisposition: `inline; filename="${fileName}"`,
    },
    customMetadata: {
      source: "email",
      clientId: safePathPart(clientId),
      receiptId: safePathPart(receiptId),
    },
  });
  return {
    fileName,
    fileType: attachment.fileType || parsed.contentType,
    fileSize: parsed.bytes.byteLength,
    fileKey: key,
    fileUrl: publicUrlFor(req, key),
    storage: "r2",
  };
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

  try {
    const clients = await readClients(bucket);
    const client = findClient(clients, payload);
    if (!client) {
      return NextResponse.json({ error: "No matching client found." }, { status: 404 });
    }

    const receiptId = payload.receiptId || makeId();
    const attachment = Array.isArray(payload.attachments) ? payload.attachments[0] : payload.attachment || payload;
    const stored = await storeFile(req, bucket, client.id, receiptId, attachment);
    const receipt = {
      id: receiptId,
      date: String(payload.date || nowISO()).slice(0, 10),
      vendor: payload.vendor || payload.from || "",
      category: receiptCategories.includes(payload.category) ? payload.category : "Materials",
      amount: payload.amount || "",
      hst: payload.hst || payload.tax || "",
      taxReady: payload.taxReady !== false,
      notes: [payload.notes, payload.emailSubject ? `Email: ${payload.emailSubject}` : ""].filter(Boolean).join("\n"),
      ...stored,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    const nextClients = clients.map((item) => {
      if (item.id !== client.id) return item;
      return {
        ...item,
        receipts: [receipt, ...(Array.isArray(item.receipts) ? item.receipts : [])],
        updatedAt: nowISO(),
        communicationLog: [
          {
            id: makeId(),
            date: nowISO(),
            type: "receipt",
            direction: "inbound",
            content: `Receipt attached from email${receipt.vendor ? `: ${receipt.vendor}` : ""}.`,
            createdBy: "Email",
          },
          ...(Array.isArray(item.communicationLog) ? item.communicationLog : []),
        ],
      };
    });

    await writeClients(bucket, nextClients);
    return NextResponse.json({ ok: true, clientId: client.id, receipt });
  } catch (err) {
    console.warn("Email receipt import failed", err);
    return NextResponse.json({ error: "Failed to import emailed receipt." }, { status: 500 });
  }
}
