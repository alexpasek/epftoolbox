import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CRM_KEY = "crm-clients.json";

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
    console.warn("CRM storage read failed", err);
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
    console.warn("CRM storage write failed", err);
    return false;
  }
}

export async function GET() {
  const clients = await readClients();
  if (!clients) {
    return NextResponse.json(
      { error: "CRM storage is not configured. Add CRM_BUCKET or reuse an existing storage binding." },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: clients });
}

export async function POST(req) {
  let payload = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clients = payload?.clients;
  if (!Array.isArray(clients)) {
    return NextResponse.json({ error: "Missing clients array" }, { status: 400 });
  }

  const ok = await writeClients(clients);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to save CRM clients. Check the Cloudflare storage binding." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, count: clients.length });
}
