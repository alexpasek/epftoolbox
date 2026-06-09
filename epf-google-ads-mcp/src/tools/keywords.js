import { z } from "zod";
import { mutateGoogleAds } from "../googleAdsClient.js";
import { approvalRequired, applied, ensureApplyApproved } from "../safety/approval.js";
import { validateKeywordIntent, validateNonBroadMatch, validateStatus } from "../safety/validators.js";

const AddKeywordsSchema = z.object({
  adGroupResourceName: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  matchType: z.enum(["PHRASE", "EXACT", "BROAD"]).default("PHRASE"),
  status: z.enum(["PAUSED", "ENABLED"]).default("PAUSED"),
  allowBroad: z.boolean().default(false),
  allowLowIntent: z.boolean().default(false),
  apply: z.boolean().default(false),
});

const KeywordStatusSchema = z.object({
  criterionResourceName: z.string().min(1),
  status: z.enum(["PAUSED", "ENABLED"]),
  apply: z.boolean().default(false),
});

export const keywordTools = [
  {
    name: "add_keywords",
    description: "Add phrase or exact match keywords. Broad requires allowBroad: true.",
    schema: AddKeywordsSchema,
    handler: async (input) => {
      const parsed = AddKeywordsSchema.parse(input);
      const matchType = validateNonBroadMatch(parsed.matchType, parsed.allowBroad);
      const status = validateStatus(parsed.status);
      const intentWarnings = validateKeywordIntent(parsed.keywords, parsed.allowLowIntent);
      const operations = parsed.keywords.map((keyword) => ({
        entity: "ad_group_criterion",
        operation: "create",
        resource: {
          ad_group: parsed.adGroupResourceName,
          status,
          keyword: {
            text: keyword,
            match_type: matchType,
          },
        },
      }));
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("add_keywords", { ...parsed, matchType, status, intentWarnings, operations });
      return applied("add_keywords", await mutateGoogleAds(operations));
    },
  },
  {
    name: "set_keyword_status",
    description: "Pause or enable a keyword after approval.",
    schema: KeywordStatusSchema,
    handler: async (input) => {
      const parsed = KeywordStatusSchema.parse(input);
      const status = validateStatus(parsed.status);
      const operations = [
        {
          entity: "ad_group_criterion",
          operation: "update",
          resource: {
            resource_name: parsed.criterionResourceName,
            status,
          },
          update_mask: ["status"],
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("set_keyword_status", { ...parsed, status, operations });
      return applied("set_keyword_status", await mutateGoogleAds(operations));
    },
  },
];
