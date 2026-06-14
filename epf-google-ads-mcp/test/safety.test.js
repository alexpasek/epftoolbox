import assert from "node:assert/strict";
import test from "node:test";

import { requireExactApproval } from "../src/safety/approval.js";
import { validateKeywordIntent, validateStatus } from "../src/safety/validators.js";
import { removeNegativeKeywordOperation, workerTools } from "../src/workerTools.js";

test("core popcorn removal service keywords are not blocked as low intent", () => {
  const keywords = [
    "popcorn ceiling removal service",
    "remove popcorn ceiling service",
    "ceiling popcorn removal",
  ];

  assert.deepEqual(validateKeywordIntent(keywords), []);
});

test("DIY popcorn ceiling keywords still require explicit low-intent approval", () => {
  assert.throws(
    () => validateKeywordIntent(["diy popcorn ceiling removal"]),
    /Low-intent keywords require allowLowIntent: true approval/
  );
});

test("Google Ads approval phrase uses one normalized APPROVER word", () => {
  assert.doesNotThrow(() => {
    requireExactApproval(" approver ", "APPROVER");
  });
  assert.throws(
    () => requireExactApproval("APPROVE", "APPROVER"),
    /APPROVER/
  );
});

test("status validator allows removed resources", () => {
  assert.equal(validateStatus("removed"), "REMOVED");
});

test("negative keyword removal infers campaign criterion operation from resource path", () => {
  assert.deepEqual(
    removeNegativeKeywordOperation({
      negativeKeywordResourceName: "customers/123/campaignCriteria/456~789",
    }),
    {
      campaignCriterionOperation: {
        remove: "customers/123/campaignCriteria/456~789",
      },
    }
  );
});

test("negative keyword removal infers ad group criterion operation from resource path", () => {
  assert.deepEqual(
    removeNegativeKeywordOperation({
      negativeKeywordResourceName: "customers/123/adGroupCriteria/456~789",
    }),
    {
      adGroupCriterionOperation: {
        remove: "customers/123/adGroupCriteria/456~789",
      },
    }
  );
});

test("negative keyword removal infers shared criterion operation from resource path", () => {
  assert.deepEqual(
    removeNegativeKeywordOperation({
      negativeKeywordResourceName: "customers/123/sharedCriteria/456~789",
    }),
    {
      sharedCriterionOperation: {
        remove: "customers/123/sharedCriteria/456~789",
      },
    }
  );
});

test("proximity target write tool requires coordinates and radius", async () => {
  const tool = workerTools({}).find((item) => item.name === "add_proximity_target_after_approval");

  await assert.rejects(
    () => tool.handler({ campaignResourceName: "customers/123/campaigns/456" }),
    /latitude/
  );
});

test("proximity target write tool previews microdegree payload", async () => {
  const tool = workerTools({}).find((item) => item.name === "add_proximity_target_after_approval");
  const result = await tool.handler({
    campaignResourceName: "customers/123/campaigns/456",
    latitude: 43.589,
    longitude: -79.644,
    radius: 12,
    radiusUnits: "KILOMETERS",
    bidModifier: 1.1,
  });

  assert.equal(result.structuredContent.result.mode, "preview_only");
  assert.deepEqual(
    result.structuredContent.result.proposedChange.mutateOperations,
    [
      {
        campaignCriterionOperation: {
          create: {
            campaign: "customers/123/campaigns/456",
            proximity: {
              geoPoint: {
                latitudeInMicroDegrees: 43589000,
                longitudeInMicroDegrees: -79644000,
              },
              radius: 12,
              radiusUnits: "KILOMETERS",
            },
            negative: false,
            bidModifier: 1.1,
          },
        },
      },
    ]
  );
});

test("business profile location filter tool previews asset set listing filter update", async () => {
  const tool = workerTools({}).find(
    (item) => item.name === "filter_business_profile_locations_after_approval"
  );
  const result = await tool.handler({
    assetSetResourceName: "customers/9466544876/assetSets/9118924916",
    listingIdFilters: ["5223601481889907889"],
  });

  assert.equal(result.structuredContent.result.mode, "preview_only");
  assert.deepEqual(
    result.structuredContent.result.proposedChange.operations,
    [
      {
        update: {
          resourceName: "customers/9466544876/assetSets/9118924916",
          locationSet: {
            businessProfileLocationSet: {
              listingIdFilters: ["5223601481889907889"],
            },
          },
        },
        updateMask: "location_set.business_profile_location_set.listing_id_filters",
      },
    ]
  );
});

test("list_keywords excludes ad group negatives from positive keyword output", async () => {
  const originalFetch = globalThis.fetch;
  const queries = [];
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes("oauth2.googleapis.com/token")) {
      return {
        ok: true,
        json: async () => ({ access_token: "test-token" }),
      };
    }

    const body = JSON.parse(options.body || "{}");
    queries.push(body.query);
    return {
      ok: true,
      json: async () => ({ results: [] }),
    };
  };

  try {
    const tool = workerTools({
      GOOGLE_ADS_DEVELOPER_TOKEN: "dev",
      GOOGLE_ADS_CLIENT_ID: "client",
      GOOGLE_ADS_CLIENT_SECRET: "secret",
      GOOGLE_ADS_REFRESH_TOKEN: "refresh",
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: "123",
      GOOGLE_ADS_CUSTOMER_ID: "456",
    }).find((item) => item.name === "list_keywords");

    await tool.handler({ limit: 10 });

    assert.match(queries[0], /ad_group_criterion\.negative = FALSE/);
    assert.match(queries[0], /ad_group_criterion\.negative/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
