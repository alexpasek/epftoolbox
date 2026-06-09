const GOOGLE_ADS_API_VERSION = "v23";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

function required(env, key) {
  const value = env?.[key];
  if (!value) throw new Error(`Missing required Cloudflare secret: ${key}`);
  return value;
}

function cleanCustomerId(value = "") {
  return String(value).replace(/-/g, "").trim();
}

export function loadWorkerConfig(env) {
  return {
    developerToken: required(env, "GOOGLE_ADS_DEVELOPER_TOKEN"),
    clientId: required(env, "GOOGLE_ADS_CLIENT_ID"),
    clientSecret: required(env, "GOOGLE_ADS_CLIENT_SECRET"),
    refreshToken: required(env, "GOOGLE_ADS_REFRESH_TOKEN"),
    loginCustomerId: cleanCustomerId(required(env, "GOOGLE_ADS_LOGIN_CUSTOMER_ID")),
    customerId: cleanCustomerId(required(env, "GOOGLE_ADS_CUSTOMER_ID")),
    bearerToken: env?.MCP_BEARER_TOKEN || "",
  };
}

async function getAccessToken(config) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google OAuth token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function googleAdsFetch(config, path, body) {
  const accessToken = await getAccessToken(config);
  const res = await fetch(`${GOOGLE_ADS_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "developer-token": config.developerToken,
      "login-customer-id": config.loginCustomerId,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Ads API error: ${JSON.stringify(data)}`);
  return data;
}

export async function queryGoogleAdsRest(env, query) {
  const config = loadWorkerConfig(env);
  const rows = [];
  let pageToken = "";

  do {
    const data = await googleAdsFetch(config, `/customers/${config.customerId}/googleAds:search`, {
      query,
      pageToken: pageToken || undefined,
    });
    rows.push(...(data.results || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return rows;
}

export async function mutateGoogleAdsRest(env, mutateOperations) {
  const config = loadWorkerConfig(env);
  return googleAdsFetch(config, `/customers/${config.customerId}/googleAds:mutate`, {
    mutateOperations,
    partialFailure: false,
    responseContentType: "MUTABLE_RESOURCE",
  });
}

export function assertBearerAuthorized(request, env) {
  const expected = env?.MCP_BEARER_TOKEN || "";
  if (!expected) {
    return new Response("MCP_BEARER_TOKEN is not configured.", { status: 500 });
  }
  const header = request.headers.get("authorization") || "";
  if (header !== `Bearer ${expected}`) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    });
  }
  return null;
}
