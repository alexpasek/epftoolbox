import { z } from "zod";
import { campaignNameFor, negativeFlagReason } from "./safety/businessRules.js";
import { approvalRequired, applied, ensureApplyApproved, requireExactApproval } from "./safety/approval.js";
import { validateCampaignName, validateDailyBudget, validateKeywordIntent, validateLocalIntentName, validateNonBroadMatch, validateResponsiveSearchAd, validateServiceAndLocation, validateStatus } from "./safety/validators.js";
import { dollarsToMicros, formatMoneyFromMicros, microsToDollars } from "./utils/money.js";
import { textResult } from "./utils/format.js";
import { loadWorkerConfig, mutateGoogleAdsRest, queryGoogleAdsRest, writeActionsEnabled } from "./workerGoogleAdsClient.js";

const APPROVAL_TEXT = "APPROVE GOOGLE ADS CHANGE";
const NEGATIVE_APPROVAL_TEXT = "APPROVE ADD NEGATIVE KEYWORDS";

const DateRangeSchema = z.object({
  startDate: z.string().default("2026-01-01"),
  endDate: z.string().default("2026-12-31"),
  limit: z.number().int().min(1).max(200).default(50),
});

const CreateCampaignSchema = z.object({
  name: z.string().optional().default(""),
  service: z.string().optional().default(""),
  city: z.string().optional().default(""),
  dailyBudget: z.number().positive(),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

const CreateAdGroupSchema = z.object({
  campaignResourceName: z.string().min(1),
  name: z.string().min(1),
  cpcBidMicros: z.number().int().positive().default(2000000),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

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

const AddNegativesSchema = z.object({
  adGroupResourceName: z.string().optional().default(""),
  campaignResourceName: z.string().optional().default(""),
  keywords: z.array(z.string().min(1)).min(1),
  matchType: z.enum(["PHRASE", "EXACT"]).default("PHRASE"),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

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

export function workerTools(env) {
  return [
    {
      name: "get_customer_info",
      description: "Read basic Google Ads customer account information.",
      schema: z.object({}),
      handler: async () => {
        const rows = await queryGoogleAdsRest(env, `
          SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager
          FROM customer
          LIMIT 1
        `);
        return textResult(rows);
      },
    },
    {
      name: "list_campaigns",
      description: "List campaigns with status and budget resource names.",
      schema: z.object({ limit: z.number().int().min(1).max(200).default(100) }),
      handler: async (input) => {
        const { limit } = z.object({ limit: z.number().int().min(1).max(200).default(100) }).parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name,
            campaign_budget.resource_name, campaign_budget.amount_micros
          FROM campaign
          ORDER BY campaign.name
          LIMIT ${limit}
        `);
        return textResult(rows.map((row) => ({
          ...row,
          dailyBudget: formatMoneyFromMicros(row.campaignBudget?.amountMicros || row.campaign_budget?.amount_micros || 0),
        })));
      },
    },
    {
      name: "list_ad_groups",
      description: "List ad groups with campaign context.",
      schema: z.object({ limit: z.number().int().min(1).max(200).default(100) }),
      handler: async (input) => {
        const { limit } = z.object({ limit: z.number().int().min(1).max(200).default(100) }).parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.name, ad_group.id, ad_group.name, ad_group.status, ad_group.resource_name
          FROM ad_group
          ORDER BY campaign.name, ad_group.name
          LIMIT ${limit}
        `);
        return textResult(rows);
      },
    },
    {
      name: "list_keywords",
      description: "List keywords with ad group and campaign context.",
      schema: z.object({ limit: z.number().int().min(1).max(200).default(100) }),
      handler: async (input) => {
        const { limit } = z.object({ limit: z.number().int().min(1).max(200).default(100) }).parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.name, ad_group.name, ad_group_criterion.resource_name,
            ad_group_criterion.status, ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type
          FROM keyword_view
          ORDER BY campaign.name, ad_group.name
          LIMIT ${limit}
        `);
        return textResult(rows);
      },
    },
    {
      name: "get_campaign_performance",
      description: "Read campaign performance for a date range.",
      schema: DateRangeSchema,
      handler: async (input) => {
        const { startDate, endDate, limit } = DateRangeSchema.parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks,
            metrics.cost_micros, metrics.ctr, metrics.average_cpc, metrics.conversions
          FROM campaign
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          ORDER BY metrics.cost_micros DESC
          LIMIT ${limit}
        `);
        return textResult(rows.map(formatPerformanceRow));
      },
    },
    {
      name: "get_search_terms",
      description: "Read search terms for a date range.",
      schema: DateRangeSchema,
      handler: async (input) => {
        const { startDate, endDate, limit } = DateRangeSchema.parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.name, ad_group.name, search_term_view.search_term, metrics.impressions,
            metrics.clicks, metrics.cost_micros, metrics.ctr, metrics.average_cpc, metrics.conversions
          FROM search_term_view
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          ORDER BY metrics.cost_micros DESC
          LIMIT ${limit}
        `);
        return textResult(rows.map(formatPerformanceRow));
      },
    },
    {
      name: "find_wasted_spend",
      description: "Find search terms with cost and zero conversions. Does not mutate.",
      schema: DateRangeSchema.extend({ minSpend: z.number().min(0).default(20) }),
      handler: async (input) => {
        const { startDate, endDate, limit, minSpend } = DateRangeSchema.extend({ minSpend: z.number().min(0).default(20) }).parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.name, ad_group.name, search_term_view.search_term, metrics.impressions,
            metrics.clicks, metrics.cost_micros, metrics.ctr, metrics.average_cpc, metrics.conversions
          FROM search_term_view
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
            AND metrics.cost_micros >= ${Math.round(minSpend * 1_000_000)}
            AND metrics.conversions = 0
          ORDER BY metrics.cost_micros DESC
          LIMIT ${limit}
        `);
        return textResult({ mutationAllowed: false, rows: rows.map(formatPerformanceRow) });
      },
    },
    {
      name: "suggest_negative_keywords",
      description: "Suggest negative keywords from costly or flagged search terms. Does not mutate.",
      schema: DateRangeSchema.extend({ minSpend: z.number().min(0).default(20) }),
      handler: async (input) => {
        const { startDate, endDate, limit, minSpend } = DateRangeSchema.extend({ minSpend: z.number().min(0).default(20) }).parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.name, ad_group.name, search_term_view.search_term, metrics.clicks, metrics.cost_micros, metrics.conversions
          FROM search_term_view
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
            AND metrics.cost_micros >= ${Math.round(minSpend * 1_000_000)}
            AND metrics.conversions = 0
          ORDER BY metrics.cost_micros DESC
          LIMIT ${limit}
        `);
        return textResult({
          mutationAllowed: false,
          suggestions: rows.map((row) => {
            const term = row.searchTermView?.searchTerm || row.search_term_view?.search_term;
            return {
              searchTerm: term,
              campaign: row.campaign?.name,
              adGroup: row.adGroup?.name || row.ad_group?.name,
              clicks: row.metrics?.clicks,
              costMicros: row.metrics?.costMicros || row.metrics?.cost_micros,
              reason: negativeFlagReason(term) || "Cost with zero conversions.",
            };
          }),
        });
      },
    },
    {
      name: "suggest_budget_changes",
      description: "Suggest campaign budget changes. Does not mutate.",
      schema: DateRangeSchema.extend({
        minConversions: z.number().min(0).default(2),
        maxCostPerConversion: z.number().positive().default(150),
        lowConversionSpend: z.number().positive().default(100),
      }),
      handler: async (input) => {
        const { startDate, endDate, limit, minConversions, maxCostPerConversion, lowConversionSpend } = DateRangeSchema.extend({
          minConversions: z.number().min(0).default(2),
          maxCostPerConversion: z.number().positive().default(150),
          lowConversionSpend: z.number().positive().default(100),
        }).parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros,
            campaign_budget.resource_name, metrics.clicks, metrics.cost_micros, metrics.conversions
          FROM campaign
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          ORDER BY metrics.cost_micros DESC
          LIMIT ${limit}
        `);
        return textResult({
          mutationAllowed: false,
          suggestions: rows.map((row) => budgetSuggestion(row, minConversions, maxCostPerConversion, lowConversionSpend)),
        });
      },
    },
    {
      name: "suggest_paused_keywords",
      description: "Suggest enabled keywords to pause. Does not mutate.",
      schema: DateRangeSchema.extend({
        minSpend: z.number().min(0).default(30),
        minClicks: z.number().int().min(0).default(5),
      }),
      handler: async (input) => {
        const { startDate, endDate, limit, minSpend, minClicks } = DateRangeSchema.extend({
          minSpend: z.number().min(0).default(30),
          minClicks: z.number().int().min(0).default(5),
        }).parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.name, ad_group.name, ad_group_criterion.resource_name,
            ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
            ad_group_criterion.status, metrics.clicks, metrics.cost_micros, metrics.conversions
          FROM keyword_view
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
            AND ad_group_criterion.status = ENABLED
            AND metrics.cost_micros >= ${Math.round(minSpend * 1_000_000)}
            AND metrics.clicks >= ${minClicks}
            AND metrics.conversions = 0
          ORDER BY metrics.cost_micros DESC
          LIMIT ${limit}
        `);
        return textResult({
          mutationAllowed: false,
          suggestions: rows.map((row) => ({
            campaign: row.campaign?.name,
            adGroup: row.adGroup?.name || row.ad_group?.name,
            criterionResourceName: row.adGroupCriterion?.resourceName || row.ad_group_criterion?.resource_name,
            keyword: row.adGroupCriterion?.keyword?.text || row.ad_group_criterion?.keyword?.text,
            matchType: row.adGroupCriterion?.keyword?.matchType || row.ad_group_criterion?.keyword?.match_type,
            suggestedStatus: "PAUSED",
            reason: "Spend/click threshold met with zero conversions.",
            spend: formatMoneyFromMicros(row.metrics?.costMicros || row.metrics?.cost_micros || 0),
            clicks: row.metrics?.clicks || 0,
            conversions: row.metrics?.conversions || 0,
          })),
        });
      },
    },
    {
      name: "create_paused_campaign",
      description: "Create a PAUSED search campaign and budget after exact approval.",
      schema: CreateCampaignSchema,
      handler: async (input) => {
        const parsed = CreateCampaignSchema.parse(input);
        const config = loadWorkerConfig(env);
        const localIntent = parsed.service || parsed.city ? validateServiceAndLocation(parsed.service, parsed.city) : null;
        if (!parsed.name && !localIntent) throw new Error(`Provide an EPF campaign name or service + city, for example: ${campaignNameFor("Popcorn Ceiling Removal", "Mississauga")}`);
        const campaignName = validateCampaignName(parsed.name || localIntent.campaignName);
        const budgetTempId = "-1";
        const campaignTempId = "-2";
        const mutateOperations = [
          {
            campaignBudgetOperation: {
              create: {
                resourceName: `customers/${config.customerId}/campaignBudgets/${budgetTempId}`,
                name: `${campaignName} Budget`,
                amountMicros: String(dollarsToMicros(validateDailyBudget(parsed.dailyBudget))),
                deliveryMethod: "STANDARD",
                explicitlyShared: false,
              },
            },
          },
          {
            campaignOperation: {
              create: {
                resourceName: `customers/${config.customerId}/campaigns/${campaignTempId}`,
                name: campaignName,
                status: "PAUSED",
                advertisingChannelType: "SEARCH",
                campaignBudget: `customers/${config.customerId}/campaignBudgets/${budgetTempId}`,
              },
            },
          },
        ];
        const preview = previewOnlyIfWritesDisabled(env, "create_paused_campaign", { ...parsed, name: campaignName, status: "PAUSED", mutateOperations });
        if (preview) return preview;
        if (!ensureApplyApproved(parsed.apply)) return approvalRequired("create_paused_campaign", { ...parsed, name: campaignName, status: "PAUSED", mutateOperations });
        requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
        return applied("create_paused_campaign", await mutateGoogleAdsRest(env, mutateOperations));
      },
    },
    {
      name: "create_paused_ad_group",
      description: "Create a PAUSED ad group after exact approval.",
      schema: CreateAdGroupSchema,
      handler: async (input) => {
        const parsed = CreateAdGroupSchema.parse(input);
        const name = validateLocalIntentName(parsed.name, "Ad group name");
        const mutateOperations = [
          {
            adGroupOperation: {
              create: {
                name,
                campaign: parsed.campaignResourceName,
                status: "PAUSED",
                type: "SEARCH_STANDARD",
                cpcBidMicros: String(parsed.cpcBidMicros),
              },
            },
          },
        ];
        const preview = previewOnlyIfWritesDisabled(env, "create_paused_ad_group", { ...parsed, name, status: "PAUSED", mutateOperations });
        if (preview) return preview;
        if (!ensureApplyApproved(parsed.apply)) return approvalRequired("create_paused_ad_group", { ...parsed, name, status: "PAUSED", mutateOperations });
        requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
        return applied("create_paused_ad_group", await mutateGoogleAdsRest(env, mutateOperations));
      },
    },
    {
      name: "create_paused_responsive_search_ad",
      description: "Create a PAUSED responsive search ad after exact approval.",
      schema: CreateResponsiveSearchAdSchema,
      handler: async (input) => {
        const parsed = CreateResponsiveSearchAdSchema.parse(input);
        validateResponsiveSearchAd(parsed);
        const mutateOperations = [
          {
            adGroupAdOperation: {
              create: {
                adGroup: parsed.adGroupResourceName,
                status: "PAUSED",
                ad: {
                  finalUrls: parsed.finalUrls,
                  responsiveSearchAd: {
                    headlines: parsed.headlines.map((text) => ({ text })),
                    descriptions: parsed.descriptions.map((text) => ({ text })),
                    path1: parsed.path1 || undefined,
                    path2: parsed.path2 || undefined,
                  },
                },
              },
            },
          },
        ];
        const preview = previewOnlyIfWritesDisabled(env, "create_paused_responsive_search_ad", { ...parsed, status: "PAUSED", mutateOperations });
        if (preview) return preview;
        if (!ensureApplyApproved(parsed.apply)) return approvalRequired("create_paused_responsive_search_ad", { ...parsed, status: "PAUSED", mutateOperations });
        requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
        return applied("create_paused_responsive_search_ad", await mutateGoogleAdsRest(env, mutateOperations));
      },
    },
    {
      name: "add_negative_keywords_after_approval",
      description: "Add ad group or campaign negative keywords only after exact approval.",
      schema: AddNegativesSchema,
      handler: async (input) => {
        const parsed = AddNegativesSchema.parse(input);
        if (!parsed.adGroupResourceName && !parsed.campaignResourceName) throw new Error("Provide adGroupResourceName or campaignResourceName.");
        const parentKey = parsed.adGroupResourceName ? "adGroup" : "campaign";
        const operationKey = parsed.adGroupResourceName ? "adGroupCriterionOperation" : "campaignCriterionOperation";
        const parentResourceName = parsed.adGroupResourceName || parsed.campaignResourceName;
        const flagged = parsed.keywords.map((keyword) => ({ keyword, reason: negativeFlagReason(keyword) })).filter((item) => item.reason);
        const mutateOperations = parsed.keywords.map((keyword) => ({
          [operationKey]: {
            create: {
              [parentKey]: parentResourceName,
              negative: true,
              keyword: { text: keyword, matchType: parsed.matchType },
            },
          },
        }));
        const preview = previewOnlyIfWritesDisabled(env, "add_negative_keywords_after_approval", { ...parsed, flagged, mutateOperations });
        if (preview) return preview;
        if (!ensureApplyApproved(parsed.apply)) return approvalRequired("add_negative_keywords_after_approval", { ...parsed, flagged, mutateOperations });
        requireExactApproval(parsed.approvalText, NEGATIVE_APPROVAL_TEXT);
        return applied("add_negative_keywords_after_approval", await mutateGoogleAdsRest(env, mutateOperations));
      },
    },
    ...controlTools(env),
  ];
}

function controlTools(env) {
  return [
    statusTool(env, "set_campaign_status_after_approval", "campaignOperation"),
    statusTool(env, "set_ad_group_status_after_approval", "adGroupOperation"),
    statusTool(env, "set_keyword_status_after_approval", "adGroupCriterionOperation"),
    {
      name: "update_budget_after_approval",
      description: "Update a campaign budget only after exact approval.",
      schema: BudgetSchema,
      handler: async (input) => {
        const parsed = BudgetSchema.parse(input);
        const mutateOperations = [
          {
            campaignBudgetOperation: {
              update: {
                resourceName: parsed.budgetResourceName,
                amountMicros: String(dollarsToMicros(validateDailyBudget(parsed.dailyBudget))),
              },
              updateMask: "amount_micros",
            },
          },
        ];
        const preview = previewOnlyIfWritesDisabled(env, "update_budget_after_approval", { ...parsed, mutateOperations });
        if (preview) return preview;
        if (!ensureApplyApproved(parsed.apply)) return approvalRequired("update_budget_after_approval", { ...parsed, mutateOperations });
        requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
        return applied("update_budget_after_approval", await mutateGoogleAdsRest(env, mutateOperations));
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
        const mutateOperations = parsed.keywords.map((keyword) => ({
          adGroupCriterionOperation: {
            create: {
              adGroup: parsed.adGroupResourceName,
              status,
              keyword: { text: keyword, matchType },
            },
          },
        }));
        const preview = previewOnlyIfWritesDisabled(env, "add_keywords_after_approval", { ...parsed, matchType, status, intentWarnings, mutateOperations });
        if (preview) return preview;
        if (!ensureApplyApproved(parsed.apply)) return approvalRequired("add_keywords_after_approval", { ...parsed, matchType, status, intentWarnings, mutateOperations });
        requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
        return applied("add_keywords_after_approval", await mutateGoogleAdsRest(env, mutateOperations));
      },
    },
  ];
}

function statusTool(env, name, operationKey) {
  return {
    name,
    description: "Pause or enable a Google Ads resource only after exact approval.",
    schema: StatusSchema,
    handler: async (input) => {
      const parsed = StatusSchema.parse(input);
      const status = validateStatus(parsed.status);
      const mutateOperations = [
        {
          [operationKey]: {
            update: { resourceName: parsed.resourceName, status },
            updateMask: "status",
          },
        },
      ];
      const preview = previewOnlyIfWritesDisabled(env, name, { ...parsed, status, mutateOperations });
      if (preview) return preview;
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired(name, { ...parsed, status, mutateOperations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied(name, await mutateGoogleAdsRest(env, mutateOperations));
    },
  };
}

function previewOnlyIfWritesDisabled(env, action, proposedChange) {
  if (writeActionsEnabled(env)) return null;
  return textResult({
    ok: true,
    mode: "preview_only",
    requiresApproval: true,
    writeActionsEnabled: false,
    action,
    proposedChange,
    message: "Preview only. Set CONFIRM_WRITE_ACTION=true to allow live Google Ads changes.",
  });
}

function formatPerformanceRow(row) {
  const metrics = row.metrics || {};
  const impressions = Number(metrics.impressions || 0);
  const clicks = Number(metrics.clicks || 0);
  const costMicros = metrics.costMicros || metrics.cost_micros || 0;
  const averageCpc = metrics.averageCpc || metrics.average_cpc || 0;
  const ctr = Number.isFinite(Number(metrics.ctr)) ? Number(metrics.ctr) : impressions ? clicks / impressions : 0;
  return {
    ...row,
    cost: formatMoneyFromMicros(costMicros),
    ctr: `${(ctr * 100).toFixed(2)}%`,
    cpc: formatMoneyFromMicros(averageCpc || (clicks ? Number(costMicros) / clicks : 0)),
  };
}

function budgetSuggestion(row, minConversions, maxCostPerConversion, lowConversionSpend) {
  const costMicros = row.metrics?.costMicros || row.metrics?.cost_micros || 0;
  const cost = microsToDollars(costMicros);
  const conversions = Number(row.metrics?.conversions || 0);
  const costPerConversion = conversions ? cost / conversions : null;
  const currentDailyBudget = microsToDollars(row.campaignBudget?.amountMicros || row.campaign_budget?.amount_micros || 0);
  let recommendation = "hold";
  let reason = "Insufficient signal for a budget change.";
  let suggestedDailyBudget = currentDailyBudget;

  if (conversions >= minConversions && costPerConversion !== null && costPerConversion <= maxCostPerConversion) {
    recommendation = "consider_increase";
    reason = `Cost per conversion is ${formatCurrency(costPerConversion)}, within target.`;
    suggestedDailyBudget = Math.round(currentDailyBudget * 1.15);
  } else if (!conversions && cost >= lowConversionSpend) {
    recommendation = "consider_decrease";
    reason = `Spent ${formatCurrency(cost)} with zero conversions.`;
    suggestedDailyBudget = Math.max(1, Math.round(currentDailyBudget * 0.75));
  }

  return {
    campaign: row.campaign?.name,
    campaignId: row.campaign?.id,
    budgetResourceName: row.campaignBudget?.resourceName || row.campaign_budget?.resource_name,
    currentDailyBudget: formatCurrency(currentDailyBudget),
    suggestedDailyBudget: formatCurrency(suggestedDailyBudget),
    recommendation,
    reason,
    spend: formatMoneyFromMicros(costMicros),
    clicks: row.metrics?.clicks || 0,
    conversions,
    costPerConversion: costPerConversion === null ? null : formatCurrency(costPerConversion),
  };
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}
