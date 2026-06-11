import { z } from "zod";
import { mutateGoogleAds } from "../googleAdsClient.js";
import { approvalRequired, applied, ensureApplyApproved, requireExactApproval } from "../safety/approval.js";
import { validateDailyBudget, validateKeywordIntent, validateNonBroadMatch, validateStatus } from "../safety/validators.js";
import { dollarsToMicros } from "../utils/money.js";

const APPROVAL_TEXT = "APPROVER";

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

const CampaignResourceSchema = z.object({
  campaignResourceName: z.string().min(1),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

const CampaignUrlSuffixSchema = CampaignResourceSchema.extend({
  finalUrlSuffix: z.string().trim().min(1).max(2048),
});

const CreateImageAssetSchema = z.object({
  imageName: z.string().trim().min(1).max(255).default("EPF Image Asset"),
  imageDataBase64: z.string().trim().min(100),
  approvalText: z.string().optional().default(""),
  apply: z.boolean().default(false),
});

const AttachImageAssetSchema = z.object({
  campaignResourceName: z.string().min(1),
  assetResourceName: z.string().min(1),
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
    name: "set_search_campaign_targeting_after_approval",
    description: "Set a campaign to Search-only networks and presence-only location targeting after exact approval.",
    schema: CampaignResourceSchema,
    handler: async (input) => {
      const parsed = CampaignResourceSchema.parse(input);
      const operations = [
        {
          entity: "campaign",
          operation: "update",
          resource: {
            resource_name: parsed.campaignResourceName,
            network_settings: {
              target_google_search: true,
              target_search_network: true,
              target_partner_search_network: false,
              target_content_network: false,
            },
            geo_target_type_setting: {
              positive_geo_target_type: "PRESENCE",
              negative_geo_target_type: "PRESENCE",
            },
          },
          update_mask: [
            "network_settings.target_google_search",
            "network_settings.target_search_network",
            "network_settings.target_partner_search_network",
            "network_settings.target_content_network",
            "geo_target_type_setting.positive_geo_target_type",
            "geo_target_type_setting.negative_geo_target_type",
          ],
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("set_search_campaign_targeting_after_approval", { ...parsed, operations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("set_search_campaign_targeting_after_approval", await mutateGoogleAds(operations));
    },
  },
  {
    name: "update_campaign_final_url_suffix_after_approval",
    description: "Update a campaign final URL suffix after exact approval.",
    schema: CampaignUrlSuffixSchema,
    handler: async (input) => {
      const parsed = CampaignUrlSuffixSchema.parse(input);
      const operations = [
        {
          entity: "campaign",
          operation: "update",
          resource: {
            resource_name: parsed.campaignResourceName,
            final_url_suffix: parsed.finalUrlSuffix,
          },
          update_mask: ["final_url_suffix"],
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("update_campaign_final_url_suffix_after_approval", { ...parsed, operations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("update_campaign_final_url_suffix_after_approval", await mutateGoogleAds(operations));
    },
  },
  {
    name: "create_image_asset_after_approval",
    description: "Create an image asset from base64 image bytes after exact approval.",
    schema: CreateImageAssetSchema,
    handler: async (input) => {
      const parsed = CreateImageAssetSchema.parse(input);
      const operations = [
        {
          entity: "asset",
          operation: "create",
          resource: {
            name: parsed.imageName,
            image_asset: {
              data: normalizeBase64Image(parsed.imageDataBase64),
            },
          },
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("create_image_asset_after_approval", scrubSensitiveWritePreview({ ...parsed, operations }));
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("create_image_asset_after_approval", await mutateGoogleAds(operations));
    },
  },
  {
    name: "attach_image_to_campaign_after_approval",
    description: "Attach an image asset to a campaign after exact approval.",
    schema: AttachImageAssetSchema,
    handler: async (input) => {
      const parsed = AttachImageAssetSchema.parse(input);
      const operations = [
        {
          entity: "campaign_asset",
          operation: "create",
          resource: {
            campaign: parsed.campaignResourceName,
            asset: parsed.assetResourceName,
            field_type: "IMAGE",
            status: "ENABLED",
          },
        },
      ];
      if (!ensureApplyApproved(parsed.apply)) return approvalRequired("attach_image_to_campaign_after_approval", { ...parsed, operations });
      requireExactApproval(parsed.approvalText, APPROVAL_TEXT);
      return applied("attach_image_to_campaign_after_approval", await mutateGoogleAds(operations));
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

function normalizeBase64Image(value) {
  return String(value).replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "").trim();
}

function scrubSensitiveWritePreview(value) {
  if (Array.isArray(value)) return value.map(scrubSensitiveWritePreview);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (["imageDataBase64", "data"].includes(key)) return [key, "[base64 image data omitted]"];
    return [key, scrubSensitiveWritePreview(item)];
  }));
}
