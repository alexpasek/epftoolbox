import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const KV_KEY = "invoices";
// Try multiple binding names to accommodate dashboard config.
const BINDINGS = ["invoice2", "invoice", "invoices"];
let warnedNoKv = false;

function kvDetails() {
  for (const binding of BINDINGS) {
    const url =
      process.env[`${binding.toUpperCase()}_REST_API_URL`] ||
      process.env.KV_REST_API_URL;
    const token =
      process.env[`${binding.toUpperCase()}_REST_API_TOKEN`] ||
      process.env.KV_REST_API_TOKEN;
    if (url && token) return { url, token, binding };
  }
  if (!warnedNoKv) {
    console.warn("KV invoices: no REST API env found, using memory fallback");
    warnedNoKv = true;
  }
  return null;
}

async function readAll() {
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

async function writeAll(list) {
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

export async function GET(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const all = await readAll();
  if (!all) {
    return NextResponse.json(
      { error: "KV not configured; add binding invoice2/invoice/invoices to Pages project." },
      { status: 500 }
    );
  }
  console.log("KV invoices GET", { id, count: all.length });
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
    console.warn("KV invoices POST invalid JSON", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = payload?.record || payload;
  if (!record || !record.id) {
    console.warn("KV invoices POST missing id");
    return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const all = await readAll();
  if (!all) {
    return NextResponse.json(
      { error: "KV not configured; add binding invoice2/invoice/invoices to Pages project." },
      { status: 500 }
    );
  }
  const idx = all.findIndex((inv) => String(inv.id) === String(record.id));
  const merged = { ...all[idx], ...record, updatedAt: record.updatedAt || now };

  if (idx >= 0) {
    all[idx] = merged;
  } else {
    all.unshift(merged);
  }

  const ok = await writeAll(all);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to persist to KV; check binding and tokens." },
      { status: 500 }
    );
  }
  console.log("KV invoices POST saved", {
    id: merged.id,
    listSize: all.length,
    brandKey: merged.brandKey,
  });
  return NextResponse.json({ ok: true, record: merged });
}
