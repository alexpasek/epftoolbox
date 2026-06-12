export const GOOGLE_ADS_RESOURCES = [
  {
    name: "get_discovery_document",
    uri: "resource://discovery-document",
    title: "Google Ads API Discovery Document",
    description: "Official Google Ads API REST discovery document for API surface, methods, resources, and schemas.",
    mimeType: "application/json",
    url: "https://googleads.googleapis.com/$discovery/rest?version=v24",
  },
  {
    name: "get_metrics",
    uri: "resource://metrics",
    title: "Google Ads API Metrics",
    description: "Official Google Ads API metrics reference.",
    mimeType: "text/html",
    url: "https://developers.google.com/google-ads/api/fields/latest/metrics",
  },
  {
    name: "get_segments",
    uri: "resource://segments",
    title: "Google Ads API Segments",
    description: "Official Google Ads API segments reference.",
    mimeType: "text/html",
    url: "https://developers.google.com/google-ads/api/fields/latest/segments",
  },
  {
    name: "get_release_notes",
    uri: "resource://release-notes",
    title: "Google Ads API Release Notes",
    description: "Official Google Ads API release notes for changes, new features, and deprecations.",
    mimeType: "text/html",
    url: "https://developers.google.com/google-ads/api/docs/release-notes",
  },
];

export function registerGoogleAdsResources(server) {
  for (const resource of GOOGLE_ADS_RESOURCES) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType,
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
        },
      },
      async () => {
        const res = await fetch(resource.url, {
          headers: { "User-Agent": "EPF Google Ads MCP" },
        });
        const text = await res.text();
        if (!res.ok) {
          return {
            contents: [
              {
                uri: resource.uri,
                mimeType: resource.mimeType,
                text: resourceFallback(resource, res.status),
              },
            ],
          };
        }
        return {
          contents: [
            {
              uri: resource.uri,
              mimeType: resource.mimeType,
              text,
            },
          ],
        };
      }
    );
  }
}

function resourceFallback(resource, status) {
  const payload = {
    ok: false,
    title: resource.title,
    sourceUrl: resource.url,
    status,
    message: "The upstream Google Ads reference URL did not return content.",
    alternatives: [
      "Use get_resource_metadata for queryable fields.",
      "Use resource://metrics for metric documentation.",
      "Use resource://segments for segment documentation.",
      "Use resource://release-notes for API changes.",
      "Use https://developers.google.com/google-ads/api/fields/latest/overview for the fields reference.",
    ],
  };

  if (resource.mimeType === "application/json") return JSON.stringify(payload, null, 2);
  return `<pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
