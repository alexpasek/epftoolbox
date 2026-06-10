import assert from "node:assert/strict";
import test from "node:test";

import { validateKeywordIntent } from "../src/safety/validators.js";

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
