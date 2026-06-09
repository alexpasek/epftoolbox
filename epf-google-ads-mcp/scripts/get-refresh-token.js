#!/usr/bin/env node

import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
const port = Number(process.env.OAUTH_PORT || 8080);
const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
const scope = "https://www.googleapis.com/auth/adwords";

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET in .env first.");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scope);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", redirectUri);
  if (requestUrl.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    res.writeHead(400);
    res.end("Missing code");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(data));

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Refresh token created. You can close this tab and copy the token from the terminal.");
    console.log("\nGOOGLE_ADS_REFRESH_TOKEN=");
    console.log(data.refresh_token || "(No refresh token returned. Revoke app access and try again with prompt=consent.)");
    server.close();
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Token exchange failed. Check terminal.");
    console.error(error?.message || error);
    server.close();
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Open this URL in your browser:\n\n${authUrl.toString()}\n`);
  console.log(`Waiting for OAuth callback on ${redirectUri}`);
});
