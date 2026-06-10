import { z } from "zod";
import { queryGoogleAds, mutateGoogleAds } from "../googleAdsClient.js";
import { negativeFlagReason } from "../safety/businessRules.js";
import { approvalRequired, applied, ensureApplyApproved } from "../safety/approval.js";

const SuggestNegativesSchema = z.object({
  startDate: z.string().default("2026-01-01"),
  endDate: z.string().default("2026-12-31"),
  minSpend: z.number().min(0).default(20),
  limit: z.number().int().min(1).max(100).default(25),
});

const AddNegativesSchema = z.object({
  adGroupResourceName: z.string().optional().default(""),
  campaignResourceName: z.string().optional().default(""),
  keywords: z.array(z.string().min(1)).min(1),
  matchType: z.enum(["PHRASE", "EXACT"]).default("PHRASE"),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

export const negativeTools = [
  {
    name: "suggest_negative_keywords",
    description: "Suggest negative keywords from costly zero-conversion search terms.",
    schema: SuggestNegativesSchema,
    handler: async (input) => {
      const { startDate, endDate, minSpend, limit } = SuggestNegativesSchema.parse(input);
      const minMicros = Math.round(minSpend * 1_000_000);
      const rows = await queryGoogleAds(`
        SELECT
          campaign.name,
          ad_group.name,
          search_term_view.search_term,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM search_term_view
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND metrics.cost_micros >= ${minMicros}
          AND metrics.conversions = 0
        ORDER BY metrics.cost_micros DESC
        LIMIT ${limit}
      `);
      return {
        suggestions: rows.map((row) => ({
          searchTerm: row.search_term_view?.search_term,
          campaign: row.campaign?.name,
          adGroup: row.ad_group?.name,
          clicks: row.metrics?.clicks,
          costMicros: row.metrics?.cost_micros,
          reason: negativeFlagReason(row.search_term_view?.search_term) || "Cost with zero conversions.",
        })),
      };
    },
  },
  {
    name: "add_negative_keywords_after_approval",
    description: "Add ad group or campaign negative keywords only after exact approval.",
    schema: AddNegativesSchema,
    handler: async (input) => {
      const parsed = AddNegativesSchema.parse(input);
      if (!parsed.adGroupResourceName && !parsed.campaignResourceName) {
        throw new Error("Provide adGroupResourceName or campaignResourceName.");
      }
      const entity = parsed.adGroupResourceName ? "ad_group_criterion" : "campaign_criterion";
      const parentField = parsed.adGroupResourceName ? "ad_group" : "campaign";
      const parentResourceName = parsed.adGroupResourceName || parsed.campaignResourceName;
      const flagged = parsed.keywords
        .map((keyword) => ({ keyword, reason: negativeFlagReason(keyword) }))
        .filter((item) => item.reason);
      const operations = parsed.keywords.map((keyword) => ({
        entity,
        operation: "create",
        resource: {
          [parentField]: parentResourceName,
          negative: true,
          keyword: {
            text: keyword,
            match_type: parsed.matchType,
          },
        },
      }));
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("add_negative_keywords_after_approval", { ...parsed, flagged, operations });
      if (parsed.approvalText !== "APPROVER ADD NEGATIVE KEYWORDS") {
        throw new Error('Exact approval required: approvalText must be "APPROVER ADD NEGATIVE KEYWORDS".');
      }
      return applied("add_negative_keywords_after_approval", await mutateGoogleAds(operations));
    },
  },
];
