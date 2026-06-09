import { z } from "zod";
import { queryGoogleAds } from "../googleAdsClient.js";
import { textResult } from "../utils/format.js";
import { formatMoneyFromMicros } from "../utils/money.js";

const DateRangeSchema = z.object({
  startDate: z.string().default("2026-01-01"),
  endDate: z.string().default("2026-12-31"),
  limit: z.number().int().min(1).max(200).default(50),
});

export const reportingTools = [
  {
    name: "get_campaign_performance",
    description: "Read campaign performance for a date range.",
    schema: DateRangeSchema,
    handler: async (input) => {
      const { startDate, endDate, limit } = DateRangeSchema.parse(input);
      const rows = await queryGoogleAds(`
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc,
          metrics.conversions
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
      const rows = await queryGoogleAds(`
        SELECT
          campaign.name,
          ad_group.name,
          search_term_view.search_term,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc,
          metrics.conversions
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
    description: "Find search terms with cost and zero conversions.",
    schema: DateRangeSchema.extend({
      minSpend: z.number().min(0).default(20),
    }),
    handler: async (input) => {
      const { startDate, endDate, limit, minSpend } = DateRangeSchema.extend({
        minSpend: z.number().min(0).default(20),
      }).parse(input);
      const minMicros = Math.round(minSpend * 1_000_000);
      const rows = await queryGoogleAds(`
        SELECT
          campaign.name,
          ad_group.name,
          search_term_view.search_term,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc,
          metrics.conversions
        FROM search_term_view
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND metrics.cost_micros >= ${minMicros}
          AND metrics.conversions = 0
        ORDER BY metrics.cost_micros DESC
        LIMIT ${limit}
      `);
      return textResult(rows.map(formatPerformanceRow));
    },
  },
];

function formatPerformanceRow(row) {
  const metrics = row.metrics || {};
  const impressions = Number(metrics.impressions || 0);
  const clicks = Number(metrics.clicks || 0);
  const ctr = Number.isFinite(Number(metrics.ctr)) ? Number(metrics.ctr) : impressions ? clicks / impressions : 0;
  return {
    ...row,
    cost: formatMoneyFromMicros(metrics.cost_micros || 0),
    ctr: `${(ctr * 100).toFixed(2)}%`,
    cpc: formatMoneyFromMicros(metrics.average_cpc || (clicks ? Number(metrics.cost_micros || 0) / clicks : 0)),
  };
}
