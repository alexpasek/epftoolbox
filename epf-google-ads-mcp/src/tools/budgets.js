import { z } from "zod";
import { mutateGoogleAds } from "../googleAdsClient.js";
import { approvalRequired, applied, ensureApplyApproved } from "../safety/approval.js";
import { validateDailyBudget } from "../safety/validators.js";
import { dollarsToMicros } from "../utils/money.js";

const CreateBudgetSchema = z.object({
  name: z.string().min(1),
  dailyBudget: z.number().positive(),
  apply: z.boolean().default(false),
});

const UpdateBudgetSchema = z.object({
  budgetResourceName: z.string().min(1),
  dailyBudget: z.number().positive(),
  apply: z.boolean().default(false),
});

export const budgetTools = [
  {
    name: "create_campaign_budget",
    description: "Create a campaign budget after approval.",
    schema: CreateBudgetSchema,
    handler: async (input) => {
      const parsed = CreateBudgetSchema.parse(input);
      const dailyBudget = validateDailyBudget(parsed.dailyBudget);
      const operations = [
        {
          entity: "campaign_budget",
          operation: "create",
          resource: {
            name: parsed.name,
            amount_micros: dollarsToMicros(dailyBudget),
            delivery_method: "STANDARD",
            explicitly_shared: false,
          },
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("create_campaign_budget", { ...parsed, operations });
      return applied("create_campaign_budget", await mutateGoogleAds(operations));
    },
  },
  {
    name: "update_budget",
    description: "Update a campaign budget after approval.",
    schema: UpdateBudgetSchema,
    handler: async (input) => {
      const parsed = UpdateBudgetSchema.parse(input);
      const dailyBudget = validateDailyBudget(parsed.dailyBudget);
      const operations = [
        {
          entity: "campaign_budget",
          operation: "update",
          resource: {
            resource_name: parsed.budgetResourceName,
            amount_micros: dollarsToMicros(dailyBudget),
          },
          update_mask: ["amount_micros"],
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("update_budget", { ...parsed, operations });
      return applied("update_budget", await mutateGoogleAds(operations));
    },
  },
];
