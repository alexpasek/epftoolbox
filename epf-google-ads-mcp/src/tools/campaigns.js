import { z } from "zod";
import { config } from "../config.js";
import { mutateGoogleAds } from "../googleAdsClient.js";
import { campaignNameFor } from "../safety/businessRules.js";
import { approvalRequired, applied, ensureApplyApproved, requireExactApproval } from "../safety/approval.js";
import { validateCampaignName, validateDailyBudget, validateServiceAndLocation } from "../safety/validators.js";
import { dollarsToMicros } from "../utils/money.js";

const CreateCampaignSchema = z.object({
  name: z.string().optional().default(""),
  service: z.string().optional().default(""),
  city: z.string().optional().default(""),
  dailyBudget: z.number().positive(),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

export const campaignTools = [
  {
    name: "create_paused_campaign",
    description: "Create a campaign budget and campaign. Defaults to PAUSED and dry-run.",
    schema: CreateCampaignSchema,
    handler: async (input) => {
      const parsed = CreateCampaignSchema.parse(input);
      const dailyBudget = validateDailyBudget(parsed.dailyBudget);
      const status = "PAUSED";
      const localIntent = parsed.service || parsed.city ? validateServiceAndLocation(parsed.service, parsed.city) : null;
      if (!parsed.name && !localIntent) {
        throw new Error(`Provide an EPF campaign name or service + city, for example: ${campaignNameFor("Popcorn Ceiling Removal", "Mississauga")}`);
      }
      const campaignName = validateCampaignName(parsed.name || localIntent.campaignName);
      const budgetTempId = "-1";
      const campaignTempId = "-2";
      const operations = [
        {
          entity: "campaign_budget",
          operation: "create",
          resource: {
            resource_name: `customers/${config.customerId}/campaignBudgets/${budgetTempId}`,
            name: `${campaignName} Budget`,
            amount_micros: dollarsToMicros(dailyBudget),
            delivery_method: "STANDARD",
            explicitly_shared: false,
          },
        },
        {
          entity: "campaign",
          operation: "create",
          resource: {
            resource_name: `customers/${config.customerId}/campaigns/${campaignTempId}`,
            name: campaignName,
            status,
            advertising_channel_type: "SEARCH",
            campaign_budget: `customers/${config.customerId}/campaignBudgets/${budgetTempId}`,
          },
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("create_paused_campaign", { ...parsed, name: campaignName, status, operations });
      requireExactApproval(parsed.approvalText, "APPROVER");
      return applied("create_paused_campaign", await mutateGoogleAds(operations));
    },
  },
];
