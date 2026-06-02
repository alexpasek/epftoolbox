import { NextResponse } from "next/server";
import { authorizeSetup, env, gmailAuthUrl, getStorageBinding } from "../_shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const setup = authorizeSetup(req);
  if (!setup.ok) {
    return NextResponse.json({ error: setup.error }, { status: 401 });
  }

  if (!env("GOOGLE_CLIENT_ID") || !env("GOOGLE_CLIENT_SECRET")) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured before connecting Gmail." },
      { status: 501 }
    );
  }

  const bucket = await getStorageBinding();
  if (!bucket) {
    return NextResponse.json({ error: "CRM_BUCKET is not configured." }, { status: 500 });
  }

  return NextResponse.redirect(gmailAuthUrl(req));
}
