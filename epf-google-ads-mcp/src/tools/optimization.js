import { z } from "zod";
import { queryGoogleAds } from "../googleAdsClient.js";
import { textResult } from "../utils/format.js";
import { formatMoneyFromMicros, microsToDollars } from "../utils/money.js";

const DateRangeSchema = z.object({
  startDate: z.string().default("2026-01-01"),
  endDate: z.string().default("2026-12-31"),
  limit: z.number().int().min(1).max(200).default(50),
});

const BudgetSuggestionSchema = DateRangeSchema.extend({
  minConversions: z.number().min(0).default(2),
  maxCostPerConversion: z.number().positive().default(150),
  lowConversionSpend: z.number().positive().default(100),
});

const PausedKeywordSuggestionSchema = DateRangeSchema.extend({
  minSpend: z.number().min(0).default(30),
  minClicks: z.number().int().min(0).default(5),
});

export const optimizationTools = [
  {
    name: "suggest_budget_changes",
    description: "Suggest budget changes from campaign performance. This tool never mutates Google Ads.",
    schema: BudgetSuggestionSchema,
    handler: async (input) => {
      const { startDate, endDate, limit, minConversions, maxCostPerConversion, lowConversionSpend } = BudgetSuggestionSchema.parse(input);
      const rows = await queryGoogleAds(`
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign_budget.amount_micros,
          campaign_budget.resource_name,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        ORDER BY metrics.cost_micros DESC
        LIMIT ${limit}
      `);

      return textResult({
        mutationAllowed: false,
        suggestions: rows.map((row) => {
          const cost = microsToDollars(row.metrics?.cost_micros || 0);
          const conversions = Number(row.metrics?.conversions || 0);
          const costPerConversion = conversions ? cost / conversions : null;
          const currentDailyBudget = microsToDollars(row.campaign_budget?.amount_micros || 0);
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
            budgetResourceName: row.campaign_budget?.resource_name,
            currentDailyBudget: formatCurrency(currentDailyBudget),
            suggestedDailyBudget: formatCurrency(suggestedDailyBudget),
            recommendation,
            reason,
            spend: formatMoneyFromMicros(row.metrics?.cost_micros || 0),
            clicks: row.metrics?.clicks || 0,
            conversions,
            costPerConversion: costPerConversion === null ? null : formatCurrency(costPerConversion),
          };
        }),
      });
    },
  },
  {
    name: "suggest_paused_keywords",
    description: "Suggest keywords to pause from spend/clicks with zero conversions. This tool never mutates Google Ads.",
    schema: PausedKeywordSuggestionSchema,
    handler: async (input) => {
      const { startDate, endDate, limit, minSpend, minClicks } = PausedKeywordSuggestionSchema.parse(input);
      const minMicros = Math.round(minSpend * 1_000_000);
      const rows = await queryGoogleAds(`
        SELECT
          campaign.name,
          ad_group.name,
          ad_group_criterion.resource_name,
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.status,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM keyword_view
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND ad_group_criterion.status = ENABLED
          AND metrics.cost_micros >= ${minMicros}
          AND metrics.clicks >= ${minClicks}
          AND metrics.conversions = 0
        ORDER BY metrics.cost_micros DESC
        LIMIT ${limit}
      `);

      return textResult({
        mutationAllowed: false,
        suggestions: rows.map((row) => ({
          campaign: row.campaign?.name,
          adGroup: row.ad_group?.name,
          criterionResourceName: row.ad_group_criterion?.resource_name,
          keyword: row.ad_group_criterion?.keyword?.text,
          matchType: row.ad_group_criterion?.keyword?.match_type,
          currentStatus: row.ad_group_criterion?.status,
          suggestedStatus: "PAUSED",
          reason: "Spend/click threshold met with zero conversions.",
          spend: formatMoneyFromMicros(row.metrics?.cost_micros || 0),
          clicks: row.metrics?.clicks || 0,
          conversions: row.metrics?.conversions || 0,
        })),
      });
    },
  },
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}
