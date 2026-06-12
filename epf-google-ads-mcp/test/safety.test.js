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
