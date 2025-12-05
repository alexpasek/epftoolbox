import { NextResponse } from "next/server";

// Cloudflare Pages requires edge runtime for Functions in Next-on-Pages
export const runtime = "edge";
export const dynamic = "force-dynamic";

const R2_KEY = "invoices.json";

async function getR2Binding() {
  if (typeof globalThis.INVOICES_BUCKET !== "undefined") {
    return globalThis.INVOICES_BUCKET;
  }
  try {
    // Edge runtime exposes env via process.env bindings in Cloudflare Pages.
    // For R2, the binding should be INVOICES_BUCKET per user's setting.
    const binding = process.env.INVOICES_BUCKET;
    if (binding) return binding;
  } catch (err) {
    console.warn("R2 binding lookup failed", err);
  }
  return null;
}

async function readAll() {
  const bucket = await getR2Binding();
  if (!bucket) return null;
  try {
    const obj = await bucket.get(R2_KEY);
    if (!obj) return [];
    const txt = await obj.text();
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("R2 read failed", err);
    return null;
  }
}

async function writeAll(list) {
  const bucket = await getR2Binding();
  if (!bucket) return false;
  try {
    await bucket.put(R2_KEY, JSON.stringify(list), {
      httpMetadata: { contentType: "application/json" },
    });
    return true;
  } catch (err) {
    console.warn("R2 write failed", err);
    return false;
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const all = await readAll();
  if (!all) {
    return NextResponse.json(
      { error: "Storage not configured; add binding INVOICES_BUCKET (R2) to Pages project." },
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
      { error: "Storage not configured; add binding INVOICES_BUCKET (R2) to Pages project." },
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
