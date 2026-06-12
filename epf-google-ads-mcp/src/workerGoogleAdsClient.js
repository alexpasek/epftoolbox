const TOKEN_URL = "https://oauth2.googleapis.com/token";

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
    apiVersion: env?.GOOGLE_ADS_API_VERSION || "v24",
  };
}

export function authMode(env) {
  return env?.MCP_AUTH_MODE === "no_auth" ? "no_auth" : "bearer";
}

export function writeActionsEnabled(env) {
  return env?.CONFIRM_WRITE_ACTION === "true";
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

async function googleAdsFetch(config, path, body, method = "POST") {
  const accessToken = await getAccessToken(config);
  const res = await fetch(`https://googleads.googleapis.com/${config.apiVersion}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "developer-token": config.developerToken,
      "login-customer-id": config.loginCustomerId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Ads API error: ${JSON.stringify(data)}`);
  return data;
}

export async function queryGoogleAdsRest(env, query) {
  const config = loadWorkerConfig(env);
  return queryGoogleAdsRestForCustomer(env, config.customerId, query);
}

export async function queryGoogleAdsRestForCustomer(env, customerId, query) {
  const config = loadWorkerConfig(env);
  const cleanId = cleanCustomerId(customerId || config.customerId);
  const rows = [];
  let pageToken = "";

  do {
    const data = await googleAdsFetch(config, `/customers/${cleanId}/googleAds:search`, {
      query,
      pageToken: pageToken || undefined,
    });
    rows.push(...(data.results || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return rows;
}

export async function listAccessibleCustomersRest(env) {
  const config = loadWorkerConfig(env);
  const data = await googleAdsFetch(config, "/customers:listAccessibleCustomers", null, "GET");
  return (data.resourceNames || []).map((resourceName) => resourceName.replace(/^customers\//, ""));
}

export async function searchGoogleAdsFieldsRest(env, query) {
  const config = loadWorkerConfig(env);
  const rows = [];
  let pageToken = "";

  do {
    const data = await googleAdsFetch(config, "/googleAdsFields:search", {
      query,
      pageToken: pageToken || undefined,
      pageSize: 10000,
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

export async function keywordPlanningGoogleAdsRest(env, method, body) {
  const config = loadWorkerConfig(env);
  return googleAdsFetch(config, `/customers/${config.customerId}:${method}`, body);
}

export function assertMcpAuthorized(request, env) {
  if (authMode(env) === "no_auth") return null;

  const expected = env?.MCP_BEARER_TOKEN || "";
  if (!expected) {
    console.log("MCP auth failed: bearer mode is enabled but MCP_BEARER_TOKEN is missing.");
    return new Response("MCP_BEARER_TOKEN is not configured.", { status: 500 });
  }
  const header = request.headers.get("authorization") || "";
  if (header !== `Bearer ${expected}`) {
    console.log("MCP auth failed: missing or invalid bearer authorization header.");
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    });
  }
  return null;
}
