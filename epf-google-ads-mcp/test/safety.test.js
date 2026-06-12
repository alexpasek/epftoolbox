import assert from "node:assert/strict";
import test from "node:test";

import { requireExactApproval } from "../src/safety/approval.js";
import { validateKeywordIntent, validateStatus } from "../src/safety/validators.js";
import { removeNegativeKeywordOperation } from "../src/workerTools.js";

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
