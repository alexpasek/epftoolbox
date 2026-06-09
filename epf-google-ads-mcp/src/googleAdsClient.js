import { GoogleAdsApi } from "google-ads-api";
import { config } from "./config.js";

export const googleAds = new GoogleAdsApi({
  client_id: config.clientId,
  client_secret: config.clientSecret,
  developer_token: config.developerToken,
});

export const customer = googleAds.Customer({
  customer_id: config.customerId,
  login_customer_id: config.loginCustomerId,
  refresh_token: config.refreshToken,
});

export async function queryGoogleAds(query) {
  return customer.query(query);
}

export async function mutateGoogleAds(operations) {
  return customer.mutateResources(operations);
}
