import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "invoices.json");

export const dynamic = "force-dynamic";

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    console.error("Failed reading invoices file", err);
    return [];
  }
}

async function writeAll(list) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
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
