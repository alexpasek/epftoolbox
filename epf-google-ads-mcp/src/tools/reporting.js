import { z } from "zod";
import { queryGoogleAds } from "../googleAdsClient.js";
import { textResult } from "../utils/format.js";
import { formatMoneyFromMicros } from "../utils/money.js";

const DateRangeSchema = z.object({
  startDate: z.string().default("2026-01-01"),
  endDate: z.string().default("2026-12-31"),
  limit: z.number().int().min(1).max(200).default(50),
});

const CampaignLookupSchema = z.object({
  campaignResourceName: z.string().optional().default(""),
  campaignId: z.string().optional().default(""),
  limit: z.number().int().min(1).max(200).default(100),
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
  {
    name: "audit_campaign_targeting",
    description: "Read campaign network settings, location type, locations, languages, and campaign negatives before enabling.",
    schema: CampaignLookupSchema,
    handler: async (input) => {
      const { campaignResourceName, campaignId, limit } = CampaignLookupSchema.parse(input);
      if (!campaignResourceName && !campaignId) throw new Error("Provide campaignResourceName or campaignId.");
      const filter = campaignResourceName ? `campaign.resource_name = '${campaignResourceName}'` : `campaign.id = ${campaignId}`;
      const campaignRows = await queryGoogleAds(`
        SELECT
          campaign.resource_name,
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.network_settings.target_google_search,
          campaign.network_settings.target_search_network,
          campaign.network_settings.target_partner_search_network,
          campaign.network_settings.target_content_network,
          campaign.geo_target_type_setting.positive_geo_target_type,
          campaign.geo_target_type_setting.negative_geo_target_type
        FROM campaign
        WHERE ${filter}
        LIMIT 1
      `);
      const campaign = campaignRows[0]?.campaign || {};
      const resourceName = campaign.resource_name || campaign.resourceName || campaignResourceName;
      const criteriaRows = await queryGoogleAds(`
        SELECT
          campaign_criterion.resource_name,
          campaign_criterion.type,
          campaign_criterion.negative,
          campaign_criterion.keyword.text,
          campaign_criterion.keyword.match_type,
          campaign_criterion.location.geo_target_constant,
          campaign_criterion.language.language_constant
        FROM campaign_criterion
        WHERE campaign_criterion.campaign = '${resourceName}'
        LIMIT ${limit}
      `);
      return textResult(buildTargetingAudit(campaignRows, criteriaRows));
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

function buildTargetingAudit(campaignRows, criteriaRows) {
  const campaign = campaignRows[0]?.campaign || {};
  const network = campaign.network_settings || campaign.networkSettings || {};
  const geoType = campaign.geo_target_type_setting || campaign.geoTargetTypeSetting || {};
  const criteria = criteriaRows.map((row) => row.campaign_criterion || row.campaignCriterion || {});
  const locations = criteria.filter((criterion) => criterion.type === "LOCATION" && !criterion.negative);
  const excludedLocations = criteria.filter((criterion) => criterion.type === "LOCATION" && criterion.negative);
  const languages = criteria.filter((criterion) => criterion.type === "LANGUAGE" && !criterion.negative);
  const negativeKeywords = criteria.filter((criterion) => criterion.type === "KEYWORD" && criterion.negative);
  return {
    ok: true,
    campaign,
    networkSettings: network,
    geoTargetTypeSetting: geoType,
    locations,
    excludedLocations,
    languages,
    negativeKeywords,
    checks: {
      searchOnly:
        Boolean(network.target_google_search ?? network.targetGoogleSearch) &&
        Boolean(network.target_search_network ?? network.targetSearchNetwork) &&
        !Boolean(network.target_partner_search_network ?? network.targetPartnerSearchNetwork) &&
        !Boolean(network.target_content_network ?? network.targetContentNetwork),
      presenceOnly:
        (geoType.positive_geo_target_type || geoType.positiveGeoTargetType) === "PRESENCE" &&
        (geoType.negative_geo_target_type || geoType.negativeGeoTargetType) === "PRESENCE",
      hasLocationTargets: locations.length > 0,
      hasCampaignNegatives: negativeKeywords.length > 0,
    },
  };
}
