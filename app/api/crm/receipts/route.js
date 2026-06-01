import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const RECEIPT_PREFIX = "receipts";
const DOCUMENT_PREFIX = "documents";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

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

function publicUrlFor(req, key) {
  const url = new URL(req.url);
  url.search = "";
  url.searchParams.set("key", key);
  return url.toString();
}

export async function GET(req) {
  const bucket = await getStorageBinding();
  if (!bucket) {
    return NextResponse.json({ error: "CRM_BUCKET is not configured." }, { status: 500 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  if (!key || (!key.startsWith(`${RECEIPT_PREFIX}/`) && !key.startsWith(`${DOCUMENT_PREFIX}/`))) {
    return NextResponse.json({ error: "Missing receipt key." }, { status: 400 });
  }

  try {
    const obj = await bucket.get(key);
    if (!obj) return NextResponse.json({ error: "Receipt file not found." }, { status: 404 });

    const headers = new Headers();
    obj.writeHttpMetadata?.(headers);
    if (!headers.get("content-type")) {
      headers.set("content-type", obj.httpMetadata?.contentType || "application/octet-stream");
    }
    headers.set("cache-control", "private, max-age=3600");
    headers.set("content-disposition", `inline; filename="${safePathPart(key.split("/").pop())}"`);
    return new Response(obj.body, { headers });
  } catch (err) {
    console.warn("Receipt file read failed", err);
    return NextResponse.json({ error: "Failed to read receipt file." }, { status: 500 });
  }
}

export async function POST(req) {
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

  const parsed = parseDataUrl(payload?.fileData || "");
  if (!parsed) {
    return NextResponse.json({ error: "Missing base64 file data." }, { status: 400 });
  }
  if (parsed.bytes.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Receipt file is too large." }, { status: 413 });
  }

  const clientId = safePathPart(payload?.clientId || "unassigned");
  const receiptId = safePathPart(payload?.receiptId || crypto.randomUUID?.() || Date.now());
  const fileName = safePathPart(payload?.fileName || "receipt");
  const prefix = payload?.folder === DOCUMENT_PREFIX ? DOCUMENT_PREFIX : RECEIPT_PREFIX;
  const key = `${prefix}/${clientId}/${receiptId}/${fileName}`;
  const contentType = payload?.fileType || parsed.contentType || "application/octet-stream";

  try {
    await bucket.put(key, parsed.bytes, {
      httpMetadata: {
        contentType,
        contentDisposition: `inline; filename="${fileName}"`,
      },
      customMetadata: {
        clientId,
        receiptId,
        originalName: String(payload?.fileName || fileName).slice(0, 200),
      },
    });

    return NextResponse.json({
      ok: true,
      key,
      url: publicUrlFor(req, key),
      fileName,
      fileType: contentType,
      fileSize: parsed.bytes.byteLength,
    });
  } catch (err) {
    console.warn("Receipt file upload failed", err);
    return NextResponse.json({ error: "Failed to store receipt file." }, { status: 500 });
  }
}

export async function DELETE(req) {
  const bucket = await getStorageBinding();
  if (!bucket) {
    return NextResponse.json({ error: "CRM_BUCKET is not configured." }, { status: 500 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  if (!key || (!key.startsWith(`${RECEIPT_PREFIX}/`) && !key.startsWith(`${DOCUMENT_PREFIX}/`))) {
    return NextResponse.json({ error: "Missing receipt key." }, { status: 400 });
  }

  try {
    await bucket.delete(key);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("Receipt file delete failed", err);
    return NextResponse.json({ error: "Failed to delete receipt file." }, { status: 500 });
  }
}
