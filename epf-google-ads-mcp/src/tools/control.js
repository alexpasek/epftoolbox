import { z } from "zod";
import { mutateGoogleAds } from "../googleAdsClient.js";
import { approvalRequired, applied, ensureApplyApproved, requireExactApproval } from "../safety/approval.js";
import { validateDailyBudget, validateKeywordIntent, validateNonBroadMatch, validateStatus } from "../safety/validators.js";
import { dollarsToMicros } from "../utils/money.js";

const APPROVAL_TEXT = "APPROVE GOOGLE ADS CHANGE";

const StatusSchema = z.object({
  resourceName: z.string().min(1),
  status: z.enum(["PAUSED", "ENABLED"]),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

const BudgetSchema = z.object({
  budgetResourceName: z.string().min(1),
  dailyBudget: z.number().positive(),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

const AddKeywordsSchema = z.object({
  adGroupResourceName: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  matchType: z.enum(["PHRASE", "EXACT", "BROAD"]).default("PHRASE"),
  status: z.enum(["PAUSED", "ENABLED"]).default("PAUSED"),
  allowBroad: z.boolean().default(false),
  allowLowIntent: z.boolean().default(false),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

export const controlTools = [
  {
    name: "set_campaign_status_after_approval",
    description: "Pause or enable a campaign only after exact approval.",
    schema: StatusSchema,
    handler: async (input) => {
      const parsed = StatusSchema.parse(input);
      const status = validateStatus(parsed.status);
      const operations = [
        {
          entity: "campaign",
          operation: "update",
          resource: { resource_name: parsed.resourceName, status },
          update_mask: ["status"],
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("set_campaign_status_after_approval", { ...parsed, status, operations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("set_campaign_status_after_approval", await mutateGoogleAds(operations));
    },
  },
  {
    name: "set_ad_group_status_after_approval",
    description: "Pause or enable an ad group only after exact approval.",
    schema: StatusSchema,
    handler: async (input) => {
      const parsed = StatusSchema.parse(input);
      const status = validateStatus(parsed.status);
      const operations = [
        {
          entity: "ad_group",
          operation: "update",
          resource: { resource_name: parsed.resourceName, status },
          update_mask: ["status"],
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("set_ad_group_status_after_approval", { ...parsed, status, operations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("set_ad_group_status_after_approval", await mutateGoogleAds(operations));
    },
  },
  {
    name: "set_keyword_status_after_approval",
    description: "Pause or enable a keyword only after exact approval.",
    schema: StatusSchema,
    handler: async (input) => {
      const parsed = StatusSchema.parse(input);
      const status = validateStatus(parsed.status);
      const operations = [
        {
          entity: "ad_group_criterion",
          operation: "update",
          resource: { resource_name: parsed.resourceName, status },
          update_mask: ["status"],
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("set_keyword_status_after_approval", { ...parsed, status, operations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("set_keyword_status_after_approval", await mutateGoogleAds(operations));
    },
  },
  {
    name: "update_budget_after_approval",
    description: "Update a campaign budget only after exact approval.",
    schema: BudgetSchema,
    handler: async (input) => {
      const parsed = BudgetSchema.parse(input);
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
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("update_budget_after_approval", { ...parsed, operations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("update_budget_after_approval", await mutateGoogleAds(operations));
    },
  },
  {
    name: "add_keywords_after_approval",
    description: "Add phrase/exact keywords after exact approval. Broad and low-intent keywords require explicit flags.",
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
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("add_keywords_after_approval", { ...parsed, matchType, status, intentWarnings, operations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("add_keywords_after_approval", await mutateGoogleAds(operations));
    },
  },
];
