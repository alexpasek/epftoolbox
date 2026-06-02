import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  gmailFetch,
  getStorageBinding,
  gmailOAuthState,
  nowISO,
  validAccessConnection,
  writeGmailConnection,
} from "../_shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function htmlPage(title, message) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui;padding:24px;line-height:1.5"><h1>${title}</h1><p>${message}</p><p><a href="/crm">Back to CRM</a></p></body></html>`,
    { headers: { "Content-Type": "text/html;charset=utf-8" } }
  );
}

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const error = url.searchParams.get("error") || "";

  if (error) {
    return htmlPage("Gmail connection failed", `Google returned: ${error}`);
  }
  if (!code || state !== gmailOAuthState()) {
    return htmlPage("Gmail connection failed", "The OAuth callback was missing a valid code or state.");
  }

  const bucket = await getStorageBinding();
  if (!bucket) {
    return htmlPage("Gmail connection failed", "CRM_BUCKET is not configured.");
  }

  try {
    const tokens = await exchangeCodeForTokens(req, code);
    const connection = await validAccessConnection(bucket, {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt: Date.now() + Number(tokens.expires_in || 3600) * 1000 - 60000,
      scope: tokens.scope || "",
      tokenType: tokens.token_type || "Bearer",
      connectedAt: nowISO(),
      updatedAt: nowISO(),
      seenMessageIds: [],
    });
    const profile = await gmailFetch(connection, "/profile");
    await writeGmailConnection(bucket, {
      ...connection,
      email: profile.emailAddress || "",
      lastHistoryId: profile.historyId || "",
      updatedAt: nowISO(),
    });

    return htmlPage("Gmail connected", `Connected ${profile.emailAddress || "this Gmail account"} to the CRM.`);
  } catch (err) {
    return htmlPage("Gmail connection failed", err.message || "Could not connect Gmail.");
  }
}
