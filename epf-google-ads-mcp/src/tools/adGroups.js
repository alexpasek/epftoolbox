import { z } from "zod";
import { mutateGoogleAds } from "../googleAdsClient.js";
import { approvalRequired, applied, ensureApplyApproved, requireExactApproval } from "../safety/approval.js";
import { validateLocalIntentName } from "../safety/validators.js";

const CreateAdGroupSchema = z.object({
  campaignResourceName: z.string().min(1),
  name: z.string().min(1),
  cpcBidMicros: z.number().int().positive().default(2000000),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

export const adGroupTools = [
  {
    name: "create_paused_ad_group",
    description: "Create a paused ad group after approval.",
    schema: CreateAdGroupSchema,
    handler: async (input) => {
      const parsed = CreateAdGroupSchema.parse(input);
      const status = "PAUSED";
      const name = validateLocalIntentName(parsed.name, "Ad group name");
      const operations = [
        {
          entity: "ad_group",
          operation: "create",
          resource: {
            name,
            campaign: parsed.campaignResourceName,
            status,
            type: "SEARCH_STANDARD",
            cpc_bid_micros: parsed.cpcBidMicros,
          },
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("create_paused_ad_group", { ...parsed, name, status, operations });
      requireExactApproval(parsed.approvalText, "APPROVER GOOGLE ADS CHANGE");
      return applied("create_paused_ad_group", await mutateGoogleAds(operations));
    },
  },
];
