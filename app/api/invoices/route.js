import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const KV_KEY = "invoices";

function memoryStore() {
  if (!globalThis.__INVOICE_MEM__) globalThis.__INVOICE_MEM__ = [];
  return globalThis.__INVOICE_MEM__;
}

function kvDetails() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

async function readFromKv() {
  const kv = kvDetails();
  if (!kv) return null;
  try {
    const res = await fetch(`${kv.url}/values/${KV_KEY}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const txt = await res.text();
    if (!txt) return [];
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("KV read failed", err);
    return null;
  }
}

async function writeToKv(list) {
  const kv = kvDetails();
  if (!kv) return false;
  try {
    await fetch(`${kv.url}/values/${KV_KEY}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${kv.token}`,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(list),
    });
    return true;
  } catch (err) {
    console.warn("KV write failed", err);
    return false;
  }
}

async function readAll() {
  const fromKv = await readFromKv();
  if (fromKv) return fromKv;
  return memoryStore();
}

async function writeAll(list) {
  const ok = await writeToKv(list);
  if (!ok) {
    globalThis.__INVOICE_MEM__ = list;
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const all = await readAll();
  if (id) {
    const found = all.find((item) => String(item.id) === String(id));
    if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(found);
  }
  return NextResponse.json({ items: all });
}

export async function POST(req) {
  let payload = null;
  try {
    payload = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = payload?.record || payload;
  if (!record || !record.id) {
    return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const all = await readAll();
  const idx = all.findIndex((inv) => String(inv.id) === String(record.id));
  const merged = { ...all[idx], ...record, updatedAt: record.updatedAt || now };

  if (idx >= 0) {
    all[idx] = merged;
  } else {
    all.unshift(merged);
  }

  await writeAll(all);
  return NextResponse.json({ ok: true, record: merged });
}
