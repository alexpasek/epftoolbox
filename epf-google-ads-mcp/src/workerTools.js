import { z } from "zod";
import { campaignNameFor, epfLocations, epfSellingPoints, epfSuggestedCallouts, epfSuggestedSitelinks, negativeFlagReason } from "./safety/businessRules.js";
import { approvalRequired, applied, ensureApplyApproved, requireExactApproval } from "./safety/approval.js";
import { validateCampaignName, validateDailyBudget, validateKeywordIntent, validateLocalIntentName, validateNonBroadMatch, validateResponsiveSearchAd, validateServiceAndLocation, validateStatus } from "./safety/validators.js";
import { dollarsToMicros, formatMoneyFromMicros, microsToDollars } from "./utils/money.js";
import { textResult } from "./utils/format.js";
import { keywordPlanningGoogleAdsRest, loadWorkerConfig, mutateGoogleAdsRest, queryGoogleAdsRest, writeActionsEnabled } from "./workerGoogleAdsClient.js";

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

const ResourceLookupSchema = z.object({
  resourceName: z.string().optional().default(""),
  id: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  limit: z.number().int().min(1).max(200).default(100),
});

const CampaignResourceSchema = z.object({
  campaignResourceName: z.string().min(1),
});

const OptionalCampaignAdGroupSchema = z.object({
  campaignResourceName: z.string().optional().default(""),
  adGroupResourceName: z.string().optional().default(""),
  status: z.string().optional().default(""),
  limit: z.number().int().min(1).max(200).default(100),
});

const KeywordPlanningSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(200),
  language: z.string().optional().default("languageConstants/1000"),
  geoTargetConstants: z.array(z.string().min(1)).optional().default(["geoTargetConstants/2124"]),
  keywordPlanNetwork: z.enum(["GOOGLE_SEARCH", "GOOGLE_SEARCH_AND_PARTNERS"]).default("GOOGLE_SEARCH"),
  pageSize: z.number().int().min(1).max(10000).default(100),
});

const KeywordIdeasSchema = KeywordPlanningSchema.extend({
  siteUrl: z.string().url().optional().default(""),
  includeAdultKeywords: z.boolean().default(false),
});

const KeywordForecastSchema = KeywordPlanningSchema.extend({
  cpcBidMicros: z.number().int().positive().optional(),
  matchType: z.enum(["BROAD", "PHRASE", "EXACT"]).default("PHRASE"),
});

const NegativeKeywordListSchema = z.object({
  sharedSetResourceName: z.string().optional().default(""),
  name: z.string().optional().default(""),
  limit: z.number().int().min(1).max(1000).default(500),
});

const GenericApprovedWriteSchema = z.object({
  resourceName: z.string().optional().default(""),
  campaignResourceName: z.string().optional().default(""),
  adGroupResourceName: z.string().optional().default(""),
  adResourceName: z.string().optional().default(""),
  keywordResourceName: z.string().optional().default(""),
  budgetResourceName: z.string().optional().default(""),
  campaignCriterionResourceName: z.string().optional().default(""),
  negativeKeywordResourceName: z.string().optional().default(""),
  recommendationResourceName: z.string().optional().default(""),
  labelResourceName: z.string().optional().default(""),
  newName: z.string().optional().default(""),
  status: z.string().optional().default(""),
  finalUrls: z.array(z.string()).optional().default([]),
  headlines: z.array(z.string()).optional().default([]),
  descriptions: z.array(z.string()).optional().default([]),
  path1: z.string().optional().default(""),
  path2: z.string().optional().default(""),
  cpcBid: z.number().optional(),
  bidModifier: z.number().optional(),
  dailyBudget: z.number().optional(),
  strategyType: z.string().optional().default(""),
  targetCpa: z.number().optional(),
  targetRoas: z.number().optional(),
  maxCpcBidLimit: z.number().optional(),
  keywordText: z.string().optional().default(""),
  newMatchType: z.enum(["EXACT", "PHRASE", "BROAD"]).optional(),
  allowBroad: z.boolean().default(false),
  locationName: z.string().optional().default(""),
  geoTargetConstant: z.string().optional().default(""),
  languageConstant: z.string().optional().default("languageConstants/1000"),
  dayOfWeek: z.string().optional().default("MONDAY"),
  startHour: z.number().int().min(0).max(23).optional(),
  startMinute: z.number().int().min(0).max(59).optional(),
  endHour: z.number().int().min(0).max(24).optional(),
  endMinute: z.number().int().min(0).max(59).optional(),
  device: z.string().optional().default("MOBILE"),
  assetText: z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),
  countryCode: z.string().optional().default("CA"),
  linkText: z.string().optional().default(""),
  line1: z.string().optional().default(""),
  line2: z.string().optional().default(""),
  finalUrl: z.string().optional().default(""),
  snippetHeader: z.string().optional().default("Services"),
  snippetValues: z.array(z.string()).optional().default([]),
  labelName: z.string().optional().default(""),
  planJson: z.any().optional(),
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
    ...advancedReadTools(env),
    ...keywordPlanningTools(env),
    ...epfPlanningTools(),
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

function advancedReadTools(env) {
  return [
    simpleQueryTool(env, "list_accessible_customers", "Return all accessible Google Ads customer accounts.", z.object({}), () => `
      SELECT customer_client.client_customer, customer_client.descriptive_name, customer_client.id,
        customer_client.manager, customer_client.status, customer_client.currency_code, customer_client.time_zone
      FROM customer_client
      LIMIT 200
    `),
    {
      name: "get_account_summary",
      description: "Return account-level campaign counts, budget, cost, clicks, conversions, CPA, CTR, and CPC.",
      schema: DateRangeSchema,
      handler: async (input) => {
        const { startDate, endDate } = DateRangeSchema.parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.status, campaign_budget.amount_micros, metrics.cost_micros,
            metrics.clicks, metrics.impressions, metrics.conversions
          FROM campaign
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          LIMIT 10000
        `);
        const summary = rows.reduce((acc, row) => {
          const status = row.campaign?.status || "";
          acc.campaigns += 1;
          if (status === "ENABLED") acc.enabledCampaigns += 1;
          if (status === "PAUSED") acc.pausedCampaigns += 1;
          acc.totalDailyBudgetMicros += Number(row.campaignBudget?.amountMicros || row.campaign_budget?.amount_micros || 0);
          acc.costMicros += Number(row.metrics?.costMicros || row.metrics?.cost_micros || 0);
          acc.clicks += Number(row.metrics?.clicks || 0);
          acc.impressions += Number(row.metrics?.impressions || 0);
          acc.conversions += Number(row.metrics?.conversions || 0);
          return acc;
        }, { campaigns: 0, enabledCampaigns: 0, pausedCampaigns: 0, totalDailyBudgetMicros: 0, costMicros: 0, clicks: 0, impressions: 0, conversions: 0 });
        return textResult({
          ok: true,
          summary: `${summary.campaigns} campaigns, ${formatMoneyFromMicros(summary.costMicros)} spend, ${summary.conversions} conversions.`,
          result: {
            ...summary,
            totalDailyBudget: formatMoneyFromMicros(summary.totalDailyBudgetMicros),
            cost: formatMoneyFromMicros(summary.costMicros),
            cpa: summary.conversions ? formatMoneyFromMicros(summary.costMicros / summary.conversions) : null,
            ctr: summary.impressions ? `${((summary.clicks / summary.impressions) * 100).toFixed(2)}%` : "0.00%",
            cpc: summary.clicks ? formatMoneyFromMicros(summary.costMicros / summary.clicks) : "$0.00",
          },
        });
      },
    },
    {
      name: "get_campaign_details",
      description: "Return detailed campaign settings plus related locations, languages, schedules, negatives, and assets.",
      schema: ResourceLookupSchema,
      handler: async (input) => {
        const { resourceName, id, limit } = ResourceLookupSchema.parse(input);
        const filter = resourceName ? `campaign.resource_name = '${resourceName}'` : `campaign.id = ${id}`;
        if (!resourceName && !id) throw new Error("Provide campaignResourceName or campaignId.");
        const campaign = await queryGoogleAdsRest(env, `
          SELECT campaign.resource_name, campaign.id, campaign.name, campaign.status, campaign.serving_status,
            campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign.start_date,
            campaign.end_date, campaign.final_url_suffix, campaign.tracking_url_template,
            campaign.network_settings.target_google_search,
            campaign.network_settings.target_search_network,
            campaign.network_settings.target_partner_search_network,
            campaign.network_settings.target_content_network,
            campaign.optimization_score, campaign_budget.resource_name, campaign_budget.amount_micros
          FROM campaign
          WHERE ${filter}
          LIMIT 1
        `);
        const campaignResourceName = campaign[0]?.campaign?.resourceName || campaign[0]?.campaign?.resource_name || resourceName;
        const [criteria, assets] = await Promise.all([
          queryGoogleAdsRest(env, `
            SELECT campaign_criterion.resource_name, campaign_criterion.type, campaign_criterion.negative,
              campaign_criterion.keyword.text, campaign_criterion.keyword.match_type,
              campaign_criterion.location.geo_target_constant, campaign_criterion.language.language_constant,
              campaign_criterion.ad_schedule.day_of_week, campaign_criterion.ad_schedule.start_hour,
              campaign_criterion.ad_schedule.end_hour, campaign_criterion.bid_modifier
            FROM campaign_criterion
            WHERE campaign_criterion.campaign = '${campaignResourceName}'
            LIMIT ${limit}
          `).catch((error) => [{ error: error.message }]),
          queryGoogleAdsRest(env, `
            SELECT campaign_asset.resource_name, campaign_asset.status, asset.resource_name, asset.type,
              asset.sitelink_asset.link_text, asset.callout_asset.callout_text, asset.call_asset.phone_number
            FROM campaign_asset
            WHERE campaign_asset.campaign = '${campaignResourceName}'
            LIMIT ${limit}
          `).catch((error) => [{ error: error.message }]),
        ]);
        return textResult({ ok: true, summary: "Campaign details loaded.", result: { campaign, criteria, assets } });
      },
    },
    {
      name: "get_ad_group_details",
      description: "Return ad group settings, keywords, ads, negatives, bid, and performance summary.",
      schema: ResourceLookupSchema,
      handler: async (input) => {
        const { resourceName, id, startDate, endDate, limit } = ResourceLookupSchema.parse(input);
        const filter = resourceName ? `ad_group.resource_name = '${resourceName}'` : `ad_group.id = ${id}`;
        if (!resourceName && !id) throw new Error("Provide adGroupResourceName or adGroupId.");
        const adGroup = await queryGoogleAdsRest(env, `
          SELECT campaign.name, campaign.resource_name, ad_group.resource_name, ad_group.id, ad_group.name,
            ad_group.status, ad_group.type, ad_group.cpc_bid_micros
          FROM ad_group
          WHERE ${filter}
          LIMIT 1
        `);
        const adGroupResourceName = adGroup[0]?.adGroup?.resourceName || adGroup[0]?.ad_group?.resource_name || resourceName;
        const dateFilter = startDate && endDate ? `AND segments.date BETWEEN '${startDate}' AND '${endDate}'` : "";
        const [keywords, ads, negatives, performance] = await Promise.all([
          queryGoogleAdsRest(env, `
            SELECT ad_group_criterion.resource_name, ad_group_criterion.status, ad_group_criterion.keyword.text,
              ad_group_criterion.keyword.match_type, ad_group_criterion.quality_info.quality_score
            FROM keyword_view
            WHERE ad_group.resource_name = '${adGroupResourceName}'
            LIMIT ${limit}
          `).catch((error) => [{ error: error.message }]),
          queryGoogleAdsRest(env, adQuery(`ad_group.resource_name = '${adGroupResourceName}'`, limit)).catch((error) => [{ error: error.message }]),
          queryGoogleAdsRest(env, `
            SELECT ad_group_criterion.resource_name, ad_group_criterion.negative,
              ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
            FROM ad_group_criterion
            WHERE ad_group.resource_name = '${adGroupResourceName}' AND ad_group_criterion.negative = TRUE
            LIMIT ${limit}
          `).catch((error) => [{ error: error.message }]),
          queryGoogleAdsRest(env, `
            SELECT ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc
            FROM ad_group
            WHERE ad_group.resource_name = '${adGroupResourceName}' ${dateFilter}
            LIMIT 1
          `).catch((error) => [{ error: error.message }]),
        ]);
        return textResult({ ok: true, summary: "Ad group details loaded.", result: { adGroup, keywords, ads, negatives, performance: performance.map(formatPerformanceRow) } });
      },
    },
    {
      name: "list_ads",
      description: "List ads with final URLs, RSA copy, strength, policy status, campaign, and ad group context.",
      schema: OptionalCampaignAdGroupSchema,
      handler: async (input) => {
        const { campaignResourceName, adGroupResourceName, status, limit } = OptionalCampaignAdGroupSchema.parse(input);
        const filters = [campaignResourceName && `campaign.resource_name = '${campaignResourceName}'`, adGroupResourceName && `ad_group.resource_name = '${adGroupResourceName}'`, status && `ad_group_ad.status = ${status}`].filter(Boolean);
        return textResult(await queryGoogleAdsRest(env, adQuery(filters.join(" AND "), limit)));
      },
    },
    {
      name: "list_responsive_search_ads",
      description: "List responsive search ads only.",
      schema: OptionalCampaignAdGroupSchema,
      handler: async (input) => {
        const parsed = OptionalCampaignAdGroupSchema.parse(input);
        const filters = [`ad_group_ad.ad.type = RESPONSIVE_SEARCH_AD`, parsed.campaignResourceName && `campaign.resource_name = '${parsed.campaignResourceName}'`, parsed.adGroupResourceName && `ad_group.resource_name = '${parsed.adGroupResourceName}'`, parsed.status && `ad_group_ad.status = ${parsed.status}`].filter(Boolean);
        return textResult(await queryGoogleAdsRest(env, adQuery(filters.join(" AND "), parsed.limit)));
      },
    },
    {
      name: "get_ad_details",
      description: "Return full ad info and optional performance.",
      schema: z.object({ adResourceName: z.string().min(1), startDate: z.string().optional().default(""), endDate: z.string().optional().default("") }),
      handler: async (input) => {
        const { adResourceName, startDate, endDate } = z.object({ adResourceName: z.string().min(1), startDate: z.string().optional().default(""), endDate: z.string().optional().default("") }).parse(input);
        const date = startDate && endDate ? `AND segments.date BETWEEN '${startDate}' AND '${endDate}'` : "";
        return textResult(await queryGoogleAdsRest(env, `
          SELECT campaign.name, ad_group.name, ad_group_ad.resource_name, ad_group_ad.status,
            ad_group_ad.policy_summary.approval_status, ad_group_ad.ad.id, ad_group_ad.ad.type,
            ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.path1,
            ad_group_ad.ad.responsive_search_ad.path2, ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad_strength,
            metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc
          FROM ad_group_ad
          WHERE ad_group_ad.resource_name = '${adResourceName}' ${date}
          LIMIT 50
        `));
      },
    },
    {
      name: "get_ad_assets",
      description: "Read actual ad creative assets: final URLs, RSA headlines, descriptions, paths, ad strength, and policy status.",
      schema: OptionalCampaignAdGroupSchema.extend({ adResourceName: z.string().optional().default("") }),
      handler: async (input) => {
        const parsed = OptionalCampaignAdGroupSchema.extend({ adResourceName: z.string().optional().default("") }).parse(input);
        const filters = [
          parsed.adResourceName && `ad_group_ad.resource_name = '${parsed.adResourceName}'`,
          parsed.campaignResourceName && `campaign.resource_name = '${parsed.campaignResourceName}'`,
          parsed.adGroupResourceName && `ad_group.resource_name = '${parsed.adGroupResourceName}'`,
          parsed.status && `ad_group_ad.status = ${parsed.status}`,
        ].filter(Boolean);
        const rows = await queryGoogleAdsRest(env, adQuery(filters.join(" AND "), parsed.limit));
        return textResult({
          ok: true,
          summary: `${rows.length} ads loaded with creative assets.`,
          result: rows.map(formatAdAssetRow),
        });
      },
    },
    reportTool(env, "get_ad_group_performance", "ad_group", "campaign.name, ad_group.name, ad_group.resource_name", "ad_group.name"),
    reportTool(env, "get_keyword_performance", "keyword_view", "campaign.name, ad_group.name, ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.quality_info.quality_score", "ad_group_criterion.keyword.text"),
    reportTool(env, "get_ad_performance", "ad_group_ad", "campaign.name, ad_group.name, ad_group_ad.resource_name, ad_group_ad.ad.id, ad_group_ad.ad.type", "ad_group_ad.ad.id"),
    reportTool(env, "get_search_term_performance", "search_term_view", "campaign.name, ad_group.name, search_term_view.search_term", "search_term_view.search_term"),
    reportTool(env, "get_location_performance", "geographic_view", "campaign.name, geographic_view.country_criterion_id, geographic_view.location_type", "metrics.cost_micros"),
    reportTool(env, "get_hour_of_day_performance", "campaign", "segments.hour", "segments.hour"),
    reportTool(env, "get_day_of_week_performance", "campaign", "segments.day_of_week", "segments.day_of_week"),
    reportTool(env, "get_device_performance", "campaign", "segments.device", "segments.device"),
    {
      name: "list_device_performance",
      description: "List device performance, optionally for one campaign.",
      schema: DateRangeSchema.extend({ campaignResourceName: z.string().optional().default("") }),
      handler: async (input) => {
        const { startDate, endDate, limit, campaignResourceName } = DateRangeSchema.extend({ campaignResourceName: z.string().optional().default("") }).parse(input);
        const where = [`segments.date BETWEEN '${startDate}' AND '${endDate}'`, campaignResourceName && `campaign.resource_name = '${campaignResourceName}'`].filter(Boolean).join(" AND ");
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.name, segments.device, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc
          FROM campaign
          WHERE ${where}
          ORDER BY metrics.cost_micros DESC
          LIMIT ${limit}
        `);
        return textResult(rows.map(formatPerformanceRow));
      },
    },
    {
      name: "analyze_search_terms",
      description: "Group search terms into good/bad/DIY/jobs/free/research categories and suggest negatives/new keywords.",
      schema: DateRangeSchema.extend({ minSpend: z.number().min(0).default(10), minClicks: z.number().int().min(0).default(1) }),
      handler: async (input) => {
        const { startDate, endDate, limit, minSpend, minClicks } = DateRangeSchema.extend({ minSpend: z.number().min(0).default(10), minClicks: z.number().int().min(0).default(1) }).parse(input);
        const rows = await queryGoogleAdsRest(env, `
          SELECT campaign.name, ad_group.name, search_term_view.search_term, metrics.clicks, metrics.cost_micros, metrics.conversions
          FROM search_term_view
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
            AND metrics.cost_micros >= ${Math.round(minSpend * 1_000_000)}
            AND metrics.clicks >= ${minClicks}
          ORDER BY metrics.cost_micros DESC
          LIMIT ${limit}
        `);
        return textResult(analyzeTerms(rows));
      },
    },
    simpleFilteredTool(env, "list_negative_keywords", "List campaign and ad group negative keywords.", OptionalCampaignAdGroupSchema, negativeKeywordQueries),
    simpleQueryTool(env, "list_negative_keyword_lists", "List shared library negative keyword exclusion lists.", z.object({ limit: z.number().int().min(1).max(200).default(100) }), ({ limit }) => `
      SELECT shared_set.resource_name, shared_set.id, shared_set.name, shared_set.type,
        shared_set.status, shared_set.member_count, shared_set.reference_count
      FROM shared_set
      WHERE shared_set.type = NEGATIVE_KEYWORDS
      ORDER BY shared_set.name
      LIMIT ${limit}
    `),
    {
      name: "get_negative_keyword_list_keywords",
      description: "List keywords inside a shared library negative keyword list by resource name or list name.",
      schema: NegativeKeywordListSchema,
      handler: async (input) => {
        const parsed = NegativeKeywordListSchema.parse(input);
        const sharedSetResourceName = await resolveSharedNegativeKeywordList(env, parsed);
        const rows = await queryGoogleAdsRest(env, `
          SELECT shared_set.resource_name, shared_set.name,
            shared_criterion.resource_name, shared_criterion.keyword.text,
            shared_criterion.keyword.match_type
          FROM shared_criterion
          WHERE shared_criterion.shared_set = '${sharedSetResourceName}'
          ORDER BY shared_criterion.keyword.text
          LIMIT ${parsed.limit}
        `);
        return textResult({
          ok: true,
          sharedSetResourceName,
          count: rows.length,
          result: rows.map(formatSharedNegativeKeywordRow),
        });
      },
    },
    {
      name: "list_all_negative_keywords",
      description: "List shared library, campaign, and ad group negative keywords in one response.",
      schema: OptionalCampaignAdGroupSchema,
      handler: async (input) => {
        const parsed = OptionalCampaignAdGroupSchema.parse(input);
        const negativeQueries = negativeKeywordQueries(parsed);
        const [sharedLists, campaignNegatives, adGroupNegatives] = await Promise.all([
          queryGoogleAdsRest(env, `
            SELECT shared_set.resource_name, shared_set.id, shared_set.name, shared_set.type,
              shared_set.status, shared_set.member_count, shared_set.reference_count
            FROM shared_set
            WHERE shared_set.type = NEGATIVE_KEYWORDS
            ORDER BY shared_set.name
            LIMIT ${parsed.limit}
          `).catch((error) => [{ error: error.message }]),
          queryGoogleAdsRest(env, negativeQueries.campaignNegatives).catch((error) => [{ error: error.message }]),
          queryGoogleAdsRest(env, negativeQueries.adGroupNegatives).catch((error) => [{ error: error.message }]),
        ]);
        const sharedListKeywords = {};
        for (const row of sharedLists.filter((item) => !item.error)) {
          const resourceName = row.sharedSet?.resourceName || row.shared_set?.resource_name;
          const listName = row.sharedSet?.name || row.shared_set?.name || resourceName;
          if (!resourceName) continue;
          sharedListKeywords[listName] = await queryGoogleAdsRest(env, `
            SELECT shared_set.resource_name, shared_set.name,
              shared_criterion.resource_name, shared_criterion.keyword.text,
              shared_criterion.keyword.match_type
            FROM shared_criterion
            WHERE shared_criterion.shared_set = '${resourceName}'
            ORDER BY shared_criterion.keyword.text
            LIMIT ${parsed.limit}
          `).then((rows) => rows.map(formatSharedNegativeKeywordRow)).catch((error) => [{ error: error.message }]);
        }
        return textResult({
          ok: true,
          result: {
            sharedLists,
            sharedListKeywords,
            campaignNegatives,
            adGroupNegatives,
          },
        });
      },
    },
    simpleCampaignTool(env, "list_campaign_locations", "List targeted/excluded campaign location criteria.", campaignCriteriaQuery("LOCATION")),
    simpleCampaignTool(env, "list_campaign_languages", "List campaign language criteria.", campaignCriteriaQuery("LANGUAGE")),
    simpleCampaignTool(env, "list_ad_schedule", "List campaign ad schedule criteria.", campaignCriteriaQuery("AD_SCHEDULE")),
    simpleCampaignTool(env, "get_budget_details", "Get campaign budget details.", (input) => `
      SELECT campaign_budget.resource_name, campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros,
        campaign_budget.delivery_method, campaign_budget.explicitly_shared, campaign_budget.status
      FROM campaign_budget
      WHERE campaign_budget.resource_name = '${input.budgetResourceName || input.campaignResourceName}'
      LIMIT 1
    `, z.object({ budgetResourceName: z.string().min(1) })),
    simpleCampaignTool(env, "list_bidding_settings", "List campaign bidding settings.", (input) => `
      SELECT campaign.resource_name, campaign.name, campaign.bidding_strategy_type,
        campaign.manual_cpc.enhanced_cpc_enabled, campaign.maximize_clicks.target_spend_micros,
        campaign.maximize_conversions.target_cpa_micros, campaign.target_cpa.target_cpa_micros
      FROM campaign
      WHERE campaign.resource_name = '${input.campaignResourceName}'
      LIMIT 1
    `),
    simpleFilteredTool(env, "list_assets", "List campaign/ad group assets and extensions.", OptionalCampaignAdGroupSchema, assetQueries),
    simpleQueryTool(env, "list_conversion_actions", "List conversion actions.", z.object({ limit: z.number().int().min(1).max(200).default(100) }), ({ limit }) => `
      SELECT conversion_action.resource_name, conversion_action.id, conversion_action.name, conversion_action.status,
        conversion_action.type, conversion_action.category, conversion_action.primary_for_goal
      FROM conversion_action
      ORDER BY conversion_action.name
      LIMIT ${limit}
    `),
    reportTool(env, "get_conversion_performance", "conversion_action", "conversion_action.name, conversion_action.resource_name", "metrics.conversions"),
    simpleCampaignTool(env, "get_campaign_conversion_breakdown", "Get conversion performance for a campaign.", (input) => `
      SELECT campaign.name, conversion_action.name, metrics.conversions, metrics.cost_micros, metrics.conversions_value
      FROM campaign
      WHERE campaign.resource_name = '${input.campaignResourceName}'
        AND segments.date BETWEEN '${input.startDate}' AND '${input.endDate}'
      ORDER BY metrics.conversions DESC
      LIMIT ${input.limit || 100}
    `, DateRangeSchema.extend({ campaignResourceName: z.string().min(1) })),
    simpleQueryTool(env, "list_landing_pages", "List landing pages and performance.", DateRangeSchema, ({ startDate, endDate, limit }) => `
      SELECT landing_page_view.unexpanded_final_url, expanded_landing_page_view.expanded_final_url,
        metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM landing_page_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.cost_micros DESC
      LIMIT ${limit}
    `),
    simpleQueryTool(env, "list_google_ads_recommendations", "List Google Ads recommendations.", z.object({ campaignResourceName: z.string().optional().default(""), limit: z.number().int().min(1).max(200).default(100) }), ({ campaignResourceName, limit }) => `
      SELECT recommendation.resource_name, recommendation.type, recommendation.impact, campaign.name, campaign.resource_name
      FROM recommendation
      ${campaignResourceName ? `WHERE campaign.resource_name = '${campaignResourceName}'` : ""}
      LIMIT ${limit}
    `),
    simpleQueryTool(env, "get_change_history", "Get Google Ads change history.", DateRangeSchema, ({ startDate, endDate, limit }) => `
      SELECT change_event.change_date_time, change_event.user_email, change_event.changed_resource_name,
        change_event.change_resource_type, change_event.client_type, change_event.old_resource, change_event.new_resource
      FROM change_event
      WHERE change_event.change_date_time BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'
      ORDER BY change_event.change_date_time DESC
      LIMIT ${limit}
    `),
    simpleQueryTool(env, "list_labels", "List account labels.", z.object({ limit: z.number().int().min(1).max(200).default(100) }), ({ limit }) => `
      SELECT label.resource_name, label.id, label.name, label.status, label.text_label.background_color, label.text_label.description
      FROM label
      ORDER BY label.name
      LIMIT ${limit}
    `),
  ];
}

function keywordPlanningTools(env) {
  return [
    {
      name: "keyword_ideas",
      description: "Search Google Keyword Planner for new keyword ideas with search volume, top-of-page bids, and competition. Read-only.",
      schema: KeywordIdeasSchema,
      handler: async (input) => {
        const parsed = KeywordIdeasSchema.parse(input);
        const seed = parsed.siteUrl
          ? { keywordAndUrlSeed: { keywords: parsed.keywords, url: parsed.siteUrl } }
          : { keywordSeed: { keywords: parsed.keywords } };
        const data = await safeKeywordPlanningCall(env, "generateKeywordIdeas", {
          language: parsed.language,
          geoTargetConstants: parsed.geoTargetConstants,
          keywordPlanNetwork: parsed.keywordPlanNetwork,
          includeAdultKeywords: parsed.includeAdultKeywords,
          pageSize: parsed.pageSize,
          ...seed,
        });
        if (data.error) return textResult(data);
        const ideas = (data.results || []).map(formatKeywordIdea);
        return textResult({
          ok: true,
          mutationAllowed: false,
          summary: `${ideas.length} keyword ideas returned.`,
          result: ideas,
        });
      },
    },
    {
      name: "get_keyword_volume",
      description: "Get monthly search volume, top-of-page bid estimates, and competition level for supplied keywords. Read-only.",
      schema: KeywordPlanningSchema,
      handler: async (input) => {
        const parsed = KeywordPlanningSchema.parse(input);
        const data = await safeKeywordPlanningCall(env, "generateKeywordHistoricalMetrics", {
          keywords: parsed.keywords,
          language: parsed.language,
          geoTargetConstants: parsed.geoTargetConstants,
          keywordPlanNetwork: parsed.keywordPlanNetwork,
        });
        if (data.error) return textResult(data);
        const metrics = (data.results || []).map(formatKeywordHistoricalMetric);
        return textResult({
          ok: true,
          mutationAllowed: false,
          summary: `${metrics.length} keyword volume rows returned.`,
          result: metrics,
        });
      },
    },
    {
      name: "get_keyword_forecast",
      description: "Get forecast estimates for keyword clicks, impressions, cost, conversions, CPC, and CTR. Read-only.",
      schema: KeywordForecastSchema,
      handler: async (input) => {
        const parsed = KeywordForecastSchema.parse(input);
        const data = await safeKeywordPlanningCall(env, "generateKeywordForecastMetrics", {
          campaign: {
            keywordPlanNetwork: parsed.keywordPlanNetwork,
            geoModifiers: parsed.geoTargetConstants.map((geoTargetConstant) => ({ geoTargetConstant })),
            languageConstants: [parsed.language],
            biddingStrategy: {
              manualCpcBiddingStrategy: {
                maxCpcBidMicros: parsed.cpcBidMicros ? String(parsed.cpcBidMicros) : undefined,
              },
            },
            adGroups: [
              {
                keywords: parsed.keywords.map((text) => ({
                  text,
                  matchType: parsed.matchType,
                  cpcBidMicros: parsed.cpcBidMicros ? String(parsed.cpcBidMicros) : undefined,
                })),
              },
            ],
          },
        });
        if (data.error) return textResult(data);
        return textResult({
          ok: true,
          mutationAllowed: false,
          summary: "Keyword forecast loaded.",
          result: formatKeywordForecast(data),
        });
      },
    },
  ];
}

async function safeKeywordPlanningCall(env, method, body) {
  try {
    return await keywordPlanningGoogleAdsRest(env, method, body);
  } catch (error) {
    const message = error?.message || String(error);
    if (message.includes("DEVELOPER_TOKEN_NOT_APPROVED") || message.includes("explorer access")) {
      return {
        ok: false,
        error: "Google Ads developer token is not approved for Keyword Planner API methods.",
        code: "DEVELOPER_TOKEN_NOT_APPROVED",
        requiredAction: "Apply for Basic or Standard Google Ads API access in Google Ads API Center. Explorer access can read normal account data but cannot use Keyword Planner idea, volume, or forecast methods.",
        mutationAllowed: false,
      };
    }
    return {
      ok: false,
      error: message,
      mutationAllowed: false,
    };
  }
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
    ...advancedWriteTools(env),
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

function simpleQueryTool(env, name, description, schema, queryFactory, mapper = (rows) => rows) {
  return {
    name,
    description,
    schema,
    handler: async (input) => {
      const parsed = schema.parse(input);
      const rows = await queryGoogleAdsRest(env, queryFactory(parsed));
      return textResult(mapper(rows, parsed));
    },
  };
}

function simpleFilteredTool(env, name, description, schema, queryFactory) {
  return {
    name,
    description,
    schema,
    handler: async (input) => {
      const parsed = schema.parse(input);
      const queries = queryFactory(parsed);
      const result = {};
      for (const [key, query] of Object.entries(queries)) {
        result[key] = await queryGoogleAdsRest(env, query).catch((error) => [{ error: error.message }]);
      }
      return textResult({ ok: true, result });
    },
  };
}

function simpleCampaignTool(env, name, description, queryFactory, schema = CampaignResourceSchema.extend({ limit: z.number().int().min(1).max(200).default(100) })) {
  return simpleQueryTool(env, name, description, schema, queryFactory);
}

function reportTool(env, name, resource, selectFields, orderField) {
  return {
    name,
    description: `Read ${name.replaceAll("_", " ")} for a date range.`,
    schema: DateRangeSchema.extend({
      campaignResourceName: z.string().optional().default(""),
      adGroupResourceName: z.string().optional().default(""),
    }),
    handler: async (input) => {
      const { startDate, endDate, limit, campaignResourceName, adGroupResourceName } = DateRangeSchema.extend({
        campaignResourceName: z.string().optional().default(""),
        adGroupResourceName: z.string().optional().default(""),
      }).parse(input);
      const filters = [
        `segments.date BETWEEN '${startDate}' AND '${endDate}'`,
        campaignResourceName && `campaign.resource_name = '${campaignResourceName}'`,
        adGroupResourceName && `ad_group.resource_name = '${adGroupResourceName}'`,
      ].filter(Boolean).join(" AND ");
      const rows = await queryGoogleAdsRest(env, `
        SELECT ${selectFields}, metrics.impressions, metrics.clicks, metrics.cost_micros,
          metrics.conversions, metrics.ctr, metrics.average_cpc, metrics.conversions_value
        FROM ${resource}
        WHERE ${filters}
        ORDER BY ${orderField === "metrics.cost_micros" ? orderField : "metrics.cost_micros"} DESC
        LIMIT ${limit}
      `);
      return textResult(rows.map(formatPerformanceRow));
    },
  };
}

function adQuery(filter = "", limit = 100) {
  return `
    SELECT campaign.name, campaign.resource_name, ad_group.name, ad_group.resource_name,
      ad_group_ad.resource_name, ad_group_ad.status, ad_group_ad.policy_summary.approval_status,
      ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.ad.final_urls,
      ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2,
      ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad_strength
    FROM ad_group_ad
    ${filter ? `WHERE ${filter}` : ""}
    ORDER BY campaign.name, ad_group.name, ad_group_ad.ad.id
    LIMIT ${limit}
  `;
}

function formatAdAssetRow(row) {
  const adGroupAd = row.adGroupAd || row.ad_group_ad || {};
  const ad = adGroupAd.ad || {};
  const rsa = ad.responsiveSearchAd || ad.responsive_search_ad || {};
  return {
    campaign: {
      name: row.campaign?.name,
      resourceName: row.campaign?.resourceName || row.campaign?.resource_name,
    },
    adGroup: {
      name: row.adGroup?.name || row.ad_group?.name,
      resourceName: row.adGroup?.resourceName || row.ad_group?.resource_name,
    },
    ad: {
      resourceName: adGroupAd.resourceName || adGroupAd.resource_name,
      adResourceName: ad.resourceName || ad.resource_name,
      id: ad.id,
      type: ad.type,
      status: adGroupAd.status,
      finalUrls: ad.finalUrls || ad.final_urls || [],
      path1: rsa.path1 || "",
      path2: rsa.path2 || "",
      headlines: (rsa.headlines || []).map((asset) => ({
        text: asset.text,
        performanceLabel: asset.assetPerformanceLabel || asset.asset_performance_label || "",
        approvalStatus: asset.policySummaryInfo?.approvalStatus || asset.policy_summary_info?.approval_status || "",
      })),
      descriptions: (rsa.descriptions || []).map((asset) => ({
        text: asset.text,
        performanceLabel: asset.assetPerformanceLabel || asset.asset_performance_label || "",
        approvalStatus: asset.policySummaryInfo?.approvalStatus || asset.policy_summary_info?.approval_status || "",
      })),
      adStrength: adGroupAd.adStrength || adGroupAd.ad_strength || "",
      policyApprovalStatus: adGroupAd.policySummary?.approvalStatus || adGroupAd.policy_summary?.approval_status || "",
    },
  };
}

function formatKeywordIdea(row) {
  const metrics = row.keywordIdeaMetrics || row.keyword_idea_metrics || {};
  return {
    text: row.text,
    closeVariants: row.closeVariants || row.close_variants || [],
    avgMonthlySearches: Number(metrics.avgMonthlySearches || metrics.avg_monthly_searches || 0),
    competition: metrics.competition || "",
    competitionIndex: Number(metrics.competitionIndex || metrics.competition_index || 0),
    lowTopOfPageBid: formatMoneyFromMicros(metrics.lowTopOfPageBidMicros || metrics.low_top_of_page_bid_micros || 0),
    highTopOfPageBid: formatMoneyFromMicros(metrics.highTopOfPageBidMicros || metrics.high_top_of_page_bid_micros || 0),
    monthlySearchVolumes: formatMonthlySearchVolumes(metrics.monthlySearchVolumes || metrics.monthly_search_volumes || []),
  };
}

function formatKeywordHistoricalMetric(row) {
  const metrics = row.keywordMetrics || row.keyword_metrics || {};
  return {
    text: row.text,
    closeVariants: row.closeVariants || row.close_variants || [],
    avgMonthlySearches: Number(metrics.avgMonthlySearches || metrics.avg_monthly_searches || 0),
    competition: metrics.competition || "",
    competitionIndex: Number(metrics.competitionIndex || metrics.competition_index || 0),
    lowTopOfPageBid: formatMoneyFromMicros(metrics.lowTopOfPageBidMicros || metrics.low_top_of_page_bid_micros || 0),
    highTopOfPageBid: formatMoneyFromMicros(metrics.highTopOfPageBidMicros || metrics.high_top_of_page_bid_micros || 0),
    monthlySearchVolumes: formatMonthlySearchVolumes(metrics.monthlySearchVolumes || metrics.monthly_search_volumes || []),
  };
}

function formatMonthlySearchVolumes(volumes = []) {
  return volumes.map((item) => ({
    year: item.year,
    month: item.month,
    monthlySearches: Number(item.monthlySearches || item.monthly_searches || 0),
  }));
}

function formatKeywordForecast(data = {}) {
  const metrics = data.campaignForecastMetrics || data.campaign_forecast_metrics || {};
  const keywordForecasts = data.keywordForecasts || data.keyword_forecasts || [];
  return {
    campaignForecast: formatForecastMetrics(metrics),
    keywordForecasts: keywordForecasts.map((item) => ({
      keyword: item.keyword,
      matchType: item.matchType || item.match_type,
      forecast: formatForecastMetrics(item.keywordForecastMetrics || item.keyword_forecast_metrics || {}),
    })),
  };
}

function formatForecastMetrics(metrics = {}) {
  const clicks = Number(metrics.clicks || 0);
  const impressions = Number(metrics.impressions || 0);
  const costMicros = metrics.costMicros || metrics.cost_micros || 0;
  return {
    clicks,
    impressions,
    cost: formatMoneyFromMicros(costMicros),
    conversions: Number(metrics.conversions || 0),
    ctr: impressions ? `${((clicks / impressions) * 100).toFixed(2)}%` : "0.00%",
    averageCpc: formatMoneyFromMicros(metrics.averageCpcMicros || metrics.average_cpc_micros || (clicks ? Number(costMicros) / clicks : 0)),
  };
}

function negativeKeywordQueries(input) {
  const campaignFilter = input.campaignResourceName ? `campaign_criterion.campaign = '${input.campaignResourceName}'` : "";
  const adGroupFilter = input.adGroupResourceName ? `ad_group.resource_name = '${input.adGroupResourceName}'` : "";
  return {
    campaignNegatives: `
      SELECT campaign.name, campaign_criterion.resource_name, campaign_criterion.negative,
        campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
      FROM campaign_criterion
      WHERE campaign_criterion.type = KEYWORD AND campaign_criterion.negative = TRUE
        ${campaignFilter ? `AND ${campaignFilter}` : ""}
      LIMIT ${input.limit}
    `,
    adGroupNegatives: `
      SELECT campaign.name, ad_group.name, ad_group_criterion.resource_name, ad_group_criterion.negative,
        ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
      FROM ad_group_criterion
      WHERE ad_group_criterion.type = KEYWORD AND ad_group_criterion.negative = TRUE
        ${adGroupFilter ? `AND ${adGroupFilter}` : ""}
      LIMIT ${input.limit}
    `,
  };
}

async function resolveSharedNegativeKeywordList(env, input) {
  if (input.sharedSetResourceName) return input.sharedSetResourceName;
  if (!input.name) throw new Error("Provide sharedSetResourceName or name.");
  const cleanName = String(input.name).replace(/'/g, "\\'");
  const rows = await queryGoogleAdsRest(env, `
    SELECT shared_set.resource_name, shared_set.name, shared_set.type, shared_set.status
    FROM shared_set
    WHERE shared_set.type = NEGATIVE_KEYWORDS
      AND shared_set.name = '${cleanName}'
    LIMIT 1
  `);
  const resourceName = rows[0]?.sharedSet?.resourceName || rows[0]?.shared_set?.resource_name;
  if (!resourceName) throw new Error(`Negative keyword list not found: ${input.name}`);
  return resourceName;
}

function formatSharedNegativeKeywordRow(row) {
  const sharedSet = row.sharedSet || row.shared_set || {};
  const criterion = row.sharedCriterion || row.shared_criterion || {};
  return {
    listName: sharedSet.name,
    sharedSetResourceName: sharedSet.resourceName || sharedSet.resource_name,
    criterionResourceName: criterion.resourceName || criterion.resource_name,
    keyword: criterion.keyword?.text,
    matchType: criterion.keyword?.matchType || criterion.keyword?.match_type,
  };
}

function campaignCriteriaQuery(type) {
  return (input) => `
    SELECT campaign.name, campaign_criterion.resource_name, campaign_criterion.type,
      campaign_criterion.negative, campaign_criterion.bid_modifier,
      campaign_criterion.location.geo_target_constant,
      campaign_criterion.language.language_constant,
      campaign_criterion.ad_schedule.day_of_week,
      campaign_criterion.ad_schedule.start_hour, campaign_criterion.ad_schedule.start_minute,
      campaign_criterion.ad_schedule.end_hour, campaign_criterion.ad_schedule.end_minute
    FROM campaign_criterion
    WHERE campaign_criterion.campaign = '${input.campaignResourceName}'
      AND campaign_criterion.type = ${type}
    LIMIT ${input.limit || 100}
  `;
}

function assetQueries(input) {
  const campaignFilter = input.campaignResourceName ? `campaign_asset.campaign = '${input.campaignResourceName}'` : "";
  const adGroupFilter = input.adGroupResourceName ? `ad_group_asset.ad_group = '${input.adGroupResourceName}'` : "";
  return {
    campaignAssets: `
      SELECT campaign.name, campaign_asset.resource_name, campaign_asset.status, campaign_asset.field_type,
        asset.resource_name, asset.id, asset.type, asset.sitelink_asset.link_text,
        asset.callout_asset.callout_text, asset.call_asset.phone_number,
        asset.structured_snippet_asset.header, asset.structured_snippet_asset.values
      FROM campaign_asset
      ${campaignFilter ? `WHERE ${campaignFilter}` : ""}
      LIMIT ${input.limit}
    `,
    adGroupAssets: `
      SELECT ad_group.name, ad_group_asset.resource_name, ad_group_asset.status, ad_group_asset.field_type,
        asset.resource_name, asset.id, asset.type, asset.sitelink_asset.link_text,
        asset.callout_asset.callout_text, asset.call_asset.phone_number,
        asset.structured_snippet_asset.header, asset.structured_snippet_asset.values
      FROM ad_group_asset
      ${adGroupFilter ? `WHERE ${adGroupFilter}` : ""}
      LIMIT ${input.limit}
    `,
  };
}

function analyzeTerms(rows) {
  const categories = { goodIntent: [], negativeCandidates: [], diy: [], jobs: [], free: [], research: [] };
  for (const row of rows) {
    const term = row.searchTermView?.searchTerm || row.search_term_view?.search_term || "";
    const clean = term.toLowerCase();
    const item = {
      searchTerm: term,
      campaign: row.campaign?.name,
      adGroup: row.adGroup?.name || row.ad_group?.name,
      clicks: row.metrics?.clicks || 0,
      cost: formatMoneyFromMicros(row.metrics?.costMicros || row.metrics?.cost_micros || 0),
      conversions: row.metrics?.conversions || 0,
    };
    const negativeReason = negativeFlagReason(term);
    if (negativeReason) categories.negativeCandidates.push({ ...item, reason: negativeReason });
    if (clean.includes("diy") || clean.includes("how to") || clean.includes("tools")) categories.diy.push(item);
    if (clean.includes("job") || clean.includes("salary") || clean.includes("career")) categories.jobs.push(item);
    if (clean.includes("free") || clean.includes("cheap")) categories.free.push(item);
    if (clean.includes("cost") || clean.includes("price") || clean.includes("what is")) categories.research.push(item);
    if (!negativeReason && (clean.includes("near me") || clean.includes("contractor") || clean.includes("service") || clean.includes("removal"))) {
      categories.goodIntent.push(item);
    }
  }
  return {
    ok: true,
    mutationAllowed: false,
    summary: `${categories.negativeCandidates.length} negative candidates and ${categories.goodIntent.length} good-intent terms found.`,
    result: categories,
  };
}

function epfPlanningTools() {
  return [
    {
      name: "build_epf_search_campaign_plan",
      description: "Create a preview plan for an EPF Google Search campaign. Does not mutate.",
      schema: z.object({
        service: z.string().min(1).default("Popcorn Ceiling Removal"),
        city: z.string().min(1).default("Mississauga"),
        dailyBudget: z.number().positive().default(50),
        finalUrl: z.string().url().default("https://epoxyfloorsplus.com/"),
      }),
      handler: async (input) => {
        const parsed = z.object({
          service: z.string().min(1).default("Popcorn Ceiling Removal"),
          city: z.string().min(1).default("Mississauga"),
          dailyBudget: z.number().positive().default(50),
          finalUrl: z.string().url().default("https://epoxyfloorsplus.com/"),
        }).parse(input);
        const campaignName = campaignNameFor(parsed.service, parsed.city);
        return textResult({
          ok: true,
          mutationAllowed: false,
          summary: `Draft plan for ${campaignName}.`,
          result: {
            campaign: { name: campaignName, status: "PAUSED", channel: "SEARCH", dailyBudget: formatCurrency(parsed.dailyBudget) },
            locations: epfLocations,
            adGroups: [
              {
                name: `${parsed.service} - ${parsed.city}`,
                status: "PAUSED",
                keywords: [
                  `[${parsed.service.toLowerCase()} ${parsed.city.toLowerCase()}]`,
                  `"${parsed.service.toLowerCase()} ${parsed.city.toLowerCase()}"`,
                  `"${parsed.service.toLowerCase()} near me"`,
                ],
                finalUrl: parsed.finalUrl,
              },
            ],
            callouts: epfSuggestedCallouts,
            sitelinks: epfSuggestedSitelinks,
            sellingPoints: epfSellingPoints,
          },
        });
      },
    },
    {
      name: "generate_epf_responsive_search_ads",
      description: "Generate EPF responsive search ad copy suggestions. Does not mutate.",
      schema: z.object({
        service: z.string().min(1).default("Popcorn Ceiling Removal"),
        city: z.string().min(1).default("Mississauga"),
        finalUrl: z.string().url().default("https://epoxyfloorsplus.com/"),
      }),
      handler: async (input) => {
        const { service, city, finalUrl } = z.object({
          service: z.string().min(1).default("Popcorn Ceiling Removal"),
          city: z.string().min(1).default("Mississauga"),
          finalUrl: z.string().url().default("https://epoxyfloorsplus.com/"),
        }).parse(input);
        return textResult({
          ok: true,
          mutationAllowed: false,
          result: {
            finalUrls: [finalUrl],
            headlines: [
              `${service} ${city}`.slice(0, 30),
              "Smooth Ceilings Fast",
              "Free Ceiling Estimate",
              "Dust Controlled Process",
              "Trusted Local Pros",
              "Book Your Free Quote",
              "Painted Popcorn Removal",
              "Ceiling Repair Experts",
              "Clean Protected Work",
              "3-Year Workmanship Warranty".slice(0, 30),
            ],
            descriptions: [
              `Professional ${service.toLowerCase()} in ${city}. Get a clean smooth ceiling finish.`,
              "Floors and walls protected. Request a free quote from EPF today.",
              "HEPA vacuum sanding, primer, and ceiling paint options available.",
              "Local crew for ceiling refinishing, repairs, and interior painting.",
            ],
            path1: "ceilings",
            path2: city.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 15),
          },
        });
      },
    },
  ];
}

function advancedWriteTools(env) {
  const writeTool = (name, description, operationFactory, schema = GenericApprovedWriteSchema) => ({
    name,
    description,
    schema,
    handler: async (input) => {
      const parsed = schema.parse(input);
      const mutateOperations = operationFactory(parsed, env);
      const preview = previewOnlyIfWritesDisabled(env, name, { ...parsed, mutateOperations });
      if (preview) return preview;
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired(name, { ...parsed, mutateOperations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied(name, await mutateGoogleAdsRest(env, mutateOperations));
    },
  });

  return [
    writeTool("rename_campaign_after_approval", "Rename a campaign after exact approval.", (p) => [{
      campaignOperation: { update: { resourceName: p.resourceName || p.campaignResourceName, name: p.newName }, updateMask: "name" },
    }]),
    writeTool("rename_ad_group_after_approval", "Rename an ad group after exact approval.", (p) => [{
      adGroupOperation: { update: { resourceName: p.resourceName || p.adGroupResourceName, name: p.newName }, updateMask: "name" },
    }]),
    writeTool("create_paused_responsive_search_ad_after_approval", "Create a PAUSED responsive search ad after exact approval.", (p) => {
      validateResponsiveSearchAd(p);
      return [{ adGroupAdOperation: { create: { adGroup: p.adGroupResourceName, status: "PAUSED", ad: { finalUrls: p.finalUrls, responsiveSearchAd: { headlines: p.headlines.map((text) => ({ text })), descriptions: p.descriptions.map((text) => ({ text })), path1: p.path1 || undefined, path2: p.path2 || undefined } } } } }];
    }),
    writeTool("update_responsive_search_ad_after_approval", "Edit RSA copy/final URL after exact approval.", (p) => [{
      adGroupAdOperation: { update: { resourceName: p.resourceName || p.adResourceName, ad: { finalUrls: p.finalUrls, responsiveSearchAd: { headlines: p.headlines.map((text) => ({ text })), descriptions: p.descriptions.map((text) => ({ text })), path1: p.path1 || undefined, path2: p.path2 || undefined } } }, updateMask: "ad.final_urls,ad.responsive_search_ad.headlines,ad.responsive_search_ad.descriptions,ad.responsive_search_ad.path1,ad.responsive_search_ad.path2" },
    }]),
    writeTool("set_ad_status_after_approval", "Pause or enable an ad after exact approval.", (p) => [{
      adGroupAdOperation: { update: { resourceName: p.resourceName || p.adResourceName, status: validateStatus(p.status) }, updateMask: "status" },
    }]),
    writeTool("update_ad_final_url_after_approval", "Change an ad final URL after exact approval.", (p) => [{
      adGroupAdOperation: { update: { resourceName: p.resourceName || p.adResourceName, ad: { finalUrls: [p.finalUrl] } }, updateMask: "ad.final_urls" },
    }]),
    writeTool("update_keyword_match_type_after_approval", "Change a keyword match type after exact approval.", (p) => [{
      adGroupCriterionOperation: { update: { resourceName: p.resourceName || p.keywordResourceName, keyword: { matchType: validateNonBroadMatch(p.newMatchType, p.allowBroad) } }, updateMask: "keyword.match_type" },
    }]),
    writeTool("update_keyword_bid_after_approval", "Change a keyword CPC bid after exact approval.", (p) => [{
      adGroupCriterionOperation: { update: { resourceName: p.resourceName || p.keywordResourceName, cpcBidMicros: String(dollarsToMicros(p.cpcBid)) }, updateMask: "cpc_bid_micros" },
    }]),
    writeTool("remove_negative_keyword_after_approval", "Remove a negative keyword criterion after exact approval.", (p) => [{
      [p.campaignCriterionResourceName ? "campaignCriterionOperation" : "adGroupCriterionOperation"]: { remove: p.campaignCriterionResourceName || p.negativeKeywordResourceName || p.resourceName },
    }]),
    writeTool("add_location_target_after_approval", "Add a campaign location target after exact approval.", (p) => [{
      campaignCriterionOperation: { create: { campaign: p.campaignResourceName, location: { geoTargetConstant: p.geoTargetConstant }, negative: false } },
    }]),
    writeTool("remove_location_target_after_approval", "Remove a campaign location target after exact approval.", (p) => [{
      campaignCriterionOperation: { remove: p.resourceName || p.campaignCriterionResourceName },
    }]),
    writeTool("set_location_bid_modifier_after_approval", "Set campaign location bid modifier after exact approval.", (p) => [{
      campaignCriterionOperation: { update: { resourceName: p.resourceName || p.campaignCriterionResourceName, bidModifier: p.bidModifier }, updateMask: "bid_modifier" },
    }]),
    writeTool("add_language_after_approval", "Add campaign language targeting after exact approval.", (p) => [{
      campaignCriterionOperation: { create: { campaign: p.campaignResourceName, language: { languageConstant: p.languageConstant } } },
    }]),
    writeTool("remove_language_after_approval", "Remove campaign language targeting after exact approval.", (p) => [{
      campaignCriterionOperation: { remove: p.resourceName || p.campaignCriterionResourceName },
    }]),
    writeTool("add_ad_schedule_after_approval", "Add a campaign ad schedule after exact approval.", (p) => [{
      campaignCriterionOperation: { create: { campaign: p.campaignResourceName, adSchedule: { dayOfWeek: p.dayOfWeek, startHour: p.startHour, startMinute: p.startMinute, endHour: p.endHour, endMinute: p.endMinute } } },
    }]),
    writeTool("remove_ad_schedule_after_approval", "Remove a campaign ad schedule after exact approval.", (p) => [{
      campaignCriterionOperation: { remove: p.resourceName || p.campaignCriterionResourceName },
    }]),
    writeTool("set_ad_schedule_bid_modifier_after_approval", "Set ad schedule bid modifier after exact approval.", (p) => [{
      campaignCriterionOperation: { update: { resourceName: p.resourceName || p.campaignCriterionResourceName, bidModifier: p.bidModifier }, updateMask: "bid_modifier" },
    }]),
    writeTool("change_bidding_strategy_after_approval", "Change campaign bidding strategy after exact approval.", biddingOperation),
    writeTool("create_sitelink_asset_after_approval", "Create a sitelink asset after exact approval.", (p) => [{
      assetOperation: { create: { sitelinkAsset: { linkText: p.linkText, description1: p.line1, description2: p.line2 }, finalUrls: [p.finalUrl] } },
    }]),
    writeTool("attach_sitelink_to_campaign_after_approval", "Attach a sitelink asset to a campaign after exact approval.", attachAssetOperation("SITELINK")),
    writeTool("create_callout_asset_after_approval", "Create a callout asset after exact approval.", (p) => [{
      assetOperation: { create: { calloutAsset: { calloutText: p.assetText } } },
    }]),
    writeTool("attach_callout_to_campaign_after_approval", "Attach a callout asset to a campaign after exact approval.", attachAssetOperation("CALLOUT")),
    writeTool("create_call_asset_after_approval", "Create a call asset after exact approval.", (p) => [{
      assetOperation: { create: { callAsset: { countryCode: p.countryCode, phoneNumber: p.phoneNumber } } },
    }]),
    writeTool("attach_call_asset_to_campaign_after_approval", "Attach a call asset to a campaign after exact approval.", attachAssetOperation("CALL")),
    writeTool("create_structured_snippet_asset_after_approval", "Create a structured snippet asset after exact approval.", (p) => [{
      assetOperation: { create: { structuredSnippetAsset: { header: p.snippetHeader, values: p.snippetValues } } },
    }]),
    writeTool("attach_structured_snippet_to_campaign_after_approval", "Attach a structured snippet asset after exact approval.", attachAssetOperation("STRUCTURED_SNIPPET")),
    writeTool("set_device_bid_modifier_after_approval", "Set device bid modifier after exact approval.", (p) => [{
      campaignCriterionOperation: { create: { campaign: p.campaignResourceName, device: { type: p.device }, bidModifier: p.bidModifier } },
    }]),
    writeTool("dismiss_recommendation_after_approval", "Dismiss a Google Ads recommendation after exact approval.", (p) => [{
      recommendationOperation: { dismiss: p.resourceName || p.recommendationResourceName },
    }]),
    writeTool("apply_recommendation_after_approval", "Apply a Google Ads recommendation after exact approval.", (p) => [{
      recommendationOperation: { apply: { resourceName: p.resourceName || p.recommendationResourceName } },
    }]),
    writeTool("create_label_after_approval", "Create a label after exact approval.", (p) => [{
      labelOperation: { create: { name: p.labelName, textLabel: { backgroundColor: "#1E8E3E", description: "Created by EPF Google Ads MCP" } } },
    }]),
    writeTool("apply_label_to_campaign_after_approval", "Apply a label to a campaign after exact approval.", (p) => [{
      campaignLabelOperation: { create: { campaign: p.campaignResourceName, label: p.labelResourceName } },
    }]),
    writeTool("apply_label_to_ad_group_after_approval", "Apply a label to an ad group after exact approval.", (p) => [{
      adGroupLabelOperation: { create: { adGroup: p.adGroupResourceName, label: p.labelResourceName } },
    }]),
    writeTool("apply_label_to_keyword_after_approval", "Apply a label to a keyword after exact approval.", (p) => [{
      adGroupCriterionLabelOperation: { create: { adGroupCriterion: p.keywordResourceName || p.resourceName, label: p.labelResourceName } },
    }]),
    writeTool("apply_label_to_ad_after_approval", "Apply a label to an ad after exact approval.", (p) => [{
      adGroupAdLabelOperation: { create: { adGroupAd: p.adResourceName || p.resourceName, label: p.labelResourceName } },
    }]),
    writeTool("create_epf_campaign_from_plan_after_approval", "Create an EPF campaign from a supplied plan after exact approval. New resources remain PAUSED.", (p, envArg) => {
      const config = loadWorkerConfig(envArg);
      const plan = p.planJson || {};
      const campaign = plan.campaign || {};
      const budgetId = "-1";
      const campaignId = "-2";
      return [
        { campaignBudgetOperation: { create: { resourceName: `customers/${config.customerId}/campaignBudgets/${budgetId}`, name: `${campaign.name || "EPF Campaign"} Budget`, amountMicros: String(dollarsToMicros(p.dailyBudget || 50)), deliveryMethod: "STANDARD", explicitlyShared: false } } },
        { campaignOperation: { create: { resourceName: `customers/${config.customerId}/campaigns/${campaignId}`, name: campaign.name || "EPF Search Campaign", status: "PAUSED", advertisingChannelType: "SEARCH", campaignBudget: `customers/${config.customerId}/campaignBudgets/${budgetId}` } } },
      ];
    }),
  ];
}

function attachAssetOperation(fieldType) {
  return (p) => [{
    campaignAssetOperation: {
      create: {
        campaign: p.campaignResourceName,
        asset: p.resourceName,
        fieldType,
        status: "ENABLED",
      },
    },
  }];
}

function biddingOperation(p) {
  const base = { resourceName: p.resourceName || p.campaignResourceName };
  const strategy = p.strategyType || "MAXIMIZE_CONVERSIONS";
  if (strategy === "MANUAL_CPC") base.manualCpc = { enhancedCpcEnabled: true };
  if (strategy === "MAXIMIZE_CLICKS") base.maximizeClicks = p.maxCpcBidLimit ? { maxCpcBidCeilingMicros: String(dollarsToMicros(p.maxCpcBidLimit)) } : {};
  if (strategy === "MAXIMIZE_CONVERSIONS") base.maximizeConversions = p.targetCpa ? { targetCpaMicros: String(dollarsToMicros(p.targetCpa)) } : {};
  if (strategy === "TARGET_ROAS") base.targetRoas = { targetRoas: p.targetRoas || 2 };
  return [{ campaignOperation: { update: base, updateMask: strategyToMask(strategy) } }];
}

function strategyToMask(strategy) {
  if (strategy === "MANUAL_CPC") return "manual_cpc";
  if (strategy === "MAXIMIZE_CLICKS") return "maximize_clicks";
  if (strategy === "TARGET_ROAS") return "target_roas";
  return "maximize_conversions";
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
