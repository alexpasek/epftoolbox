import { NextResponse } from "next/server";
import {
  applyGmailEntriesToClients,
  findClientForMessage,
  getStorageBinding,
  gmailFetch,
  messagePayload,
  nowISO,
  readClients,
  readGmailConnection,
  summarizeConnection,
  validAccessConnection,
  writeClients,
  writeGmailConnection,
} from "./_shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MAX_MESSAGES_PER_LABEL = 15;
const MAX_SEEN_MESSAGES = 500;

export async function GET() {
  const bucket = await getStorageBinding();
  if (!bucket) {
    return NextResponse.json({ connected: false, error: "CRM_BUCKET is not configured." }, { status: 500 });
  }

  const connection = await readGmailConnection(bucket);
  return NextResponse.json(summarizeConnection(connection));
}

async function listMessageRefs(connection, labelIds) {
  const params = new URLSearchParams({
    maxResults: String(MAX_MESSAGES_PER_LABEL),
    q: "newer_than:30d",
  });
  labelIds.forEach((label) => params.append("labelIds", label));
  const data = await gmailFetch(connection, `/messages?${params.toString()}`);
  return Array.isArray(data.messages) ? data.messages : [];
}

async function loadMessage(connection, id) {
  const params = new URLSearchParams({ format: "metadata", metadataHeaders: "From" });
  ["To", "Cc", "Date", "Subject"].forEach((header) => params.append("metadataHeaders", header));
  return gmailFetch(connection, `/messages/${encodeURIComponent(id)}?${params.toString()}`);
}

export async function POST(req) {
  const bucket = await getStorageBinding();
  if (!bucket) {
    return NextResponse.json({ error: "CRM_BUCKET is not configured." }, { status: 500 });
  }

  try {
    const storedConnection = await readGmailConnection(bucket);
    if (!storedConnection?.refreshToken) {
      return NextResponse.json({ error: "Gmail is not connected." }, { status: 409 });
    }

    const connection = await validAccessConnection(bucket, storedConnection);
    const profile = await gmailFetch(connection, "/profile");
    const profileEmail = profile.emailAddress || connection.email || "";
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const seenMessageIds = new Set(force ? [] : connection.seenMessageIds || []);
    const clients = await readClients(bucket);

    const inboxRefs = await listMessageRefs(connection, ["INBOX"]);
    const sentRefs = await listMessageRefs(connection, ["SENT"]);
    const refs = [
      ...inboxRefs.map((ref) => ({ ...ref, direction: "inbound" })),
      ...sentRefs.map((ref) => ({ ...ref, direction: "outbound" })),
    ].filter((ref) => ref.id && !seenMessageIds.has(ref.id));

    const messages = await Promise.all(refs.slice(0, 30).map(async (ref) => {
      const message = await loadMessage(connection, ref.id);
      return messagePayload(message, ref.direction, profileEmail);
    }));

    const matchedEntries = messages.filter((entry) => findClientForMessage(clients, entry, entry.direction));
    const matchedClientIds = [...new Set(
      matchedEntries
        .map((entry) => findClientForMessage(clients, entry, entry.direction)?.id)
        .filter(Boolean)
    )];
    const { clients: nextClients, changed } = applyGmailEntriesToClients(clients, matchedEntries);

    if (changed) {
      await writeClients(bucket, nextClients);
    }

    const nextSeenIds = [
      ...matchedEntries.map((message) => message.sourceMessageId).filter(Boolean),
      ...(connection.seenMessageIds || []),
    ].filter((id, index, list) => id && list.indexOf(id) === index).slice(0, MAX_SEEN_MESSAGES);

    const nextConnection = {
      ...connection,
      email: profileEmail,
      lastHistoryId: profile.historyId || connection.lastHistoryId || "",
      lastSyncAt: nowISO(),
      seenMessageIds: nextSeenIds,
      updatedAt: nowISO(),
    };
    await writeGmailConnection(bucket, nextConnection);

    return NextResponse.json({
      ok: true,
      email: profileEmail,
      scanned: messages.length,
      matched: matchedEntries.length,
      matchedClientIds,
      force,
      updatedClients: changed,
      lastSyncAt: nextConnection.lastSyncAt,
    });
  } catch (err) {
    console.warn("Gmail direct sync failed", err);
    return NextResponse.json({ error: err.message || "Gmail sync failed." }, { status: 500 });
  }
}
