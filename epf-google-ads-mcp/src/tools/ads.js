import { z } from "zod";
import { mutateGoogleAds } from "../googleAdsClient.js";
import { approvalRequired, applied, ensureApplyApproved, requireExactApproval } from "../safety/approval.js";
import { validateResponsiveSearchAd } from "../safety/validators.js";

const CreateResponsiveSearchAdSchema = z.object({
  adGroupResourceName: z.string().min(1),
  finalUrls: z.array(z.string().url()).min(1),
  headlines: z.array(z.string().min(1)).min(3),
  descriptions: z.array(z.string().min(1)).min(2),
  path1: z.string().optional().default(""),
  path2: z.string().optional().default(""),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

export const adTools = [
  {
    name: "create_paused_responsive_search_ad",
    description: "Create a paused responsive search ad after approval.",
    schema: CreateResponsiveSearchAdSchema,
    handler: async (input) => {
      const parsed = CreateResponsiveSearchAdSchema.parse(input);
      validateResponsiveSearchAd(parsed);
      const status = "PAUSED";
      const operations = [
        {
          entity: "ad_group_ad",
          operation: "create",
          resource: {
            ad_group: parsed.adGroupResourceName,
            status,
            ad: {
              final_urls: parsed.finalUrls,
              responsive_search_ad: {
                headlines: parsed.headlines.map((text) => ({ text })),
                descriptions: parsed.descriptions.map((text) => ({ text })),
                path1: parsed.path1 || undefined,
                path2: parsed.path2 || undefined,
              },
            },
          },
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) {
        return approvalRequired("create_paused_responsive_search_ad", { ...parsed, status, operations });
      }
      requireExactApproval(parsed.approvalText, "APPROVE GOOGLE ADS CHANGE");
      return applied("create_paused_responsive_search_ad", await mutateGoogleAds(operations));
    },
  },
];
