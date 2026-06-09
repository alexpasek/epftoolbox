import { epfLocations, epfServices, campaignNameFor, keywordIntentWarning } from "./businessRules.js";

const allowedStatuses = ["PAUSED", "ENABLED"];
const allowedMatchTypes = ["PHRASE", "EXACT", "BROAD"];

export function validateStatus(status = "PAUSED") {
  const clean = String(status || "PAUSED").toUpperCase();
  if (!allowedStatuses.includes(clean)) throw new Error(`Invalid status: ${status}`);
  return clean;
}

export function validatePausedDefault(status) {
  return validateStatus(status || "PAUSED");
}

export function validateDailyBudget(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Daily budget must be greater than 0.");
  if (amount > 500) throw new Error("Daily budget over $500 requires manual review outside this tool.");
  return amount;
}

export function validateCampaignName(name = "") {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("Campaign name is required.");
  if (!clean.startsWith("EPF - ")) {
    throw new Error(`Campaign name should follow EPF naming, for example: ${campaignNameFor(epfServices[0], epfLocations[0])}`);
  }
  return clean;
}

export function validateServiceAndLocation(service = "", city = "") {
  const matchedService = epfServices.find((item) => item.toLowerCase() === String(service).toLowerCase());
  const matchedCity = epfLocations.find((item) => item.toLowerCase() === String(city).toLowerCase());
  if (!matchedService) throw new Error(`Unsupported EPF service: ${service}. Use one of: ${epfServices.join(", ")}`);
  if (!matchedCity) throw new Error(`Unsupported EPF city: ${city}. Use one of: ${epfLocations.join(", ")}`);
  return { service: matchedService, city: matchedCity, campaignName: campaignNameFor(matchedService, matchedCity) };
}

export function validateLocalIntentName(name = "", label = "Name") {
  const clean = String(name || "").trim();
  if (!clean) throw new Error(`${label} is required.`);
  if (clean.length > 255) throw new Error(`${label} is too long.`);
  return clean;
}

export function validateMatchType(matchType = "PHRASE") {
  const clean = String(matchType || "PHRASE").toUpperCase();
  if (!allowedMatchTypes.includes(clean)) throw new Error(`Invalid match type: ${matchType}`);
  return clean;
}

export function validateNonBroadMatch(matchType = "PHRASE", allowBroad = false) {
  const clean = validateMatchType(matchType);
  if (clean === "BROAD" && !allowBroad) {
    throw new Error("Broad match requires explicit allowBroad: true approval.");
  }
  return clean;
}

export function validateKeywordIntent(keywords = [], allowLowIntent = false) {
  const warnings = keywords
    .map((keyword) => ({ keyword, warning: keywordIntentWarning(keyword) }))
    .filter((item) => item.warning);
  if (warnings.length && !allowLowIntent) {
    throw new Error(
      `Low-intent keywords require allowLowIntent: true approval. ${warnings
        .map((item) => `${item.keyword} (${item.warning})`)
        .join("; ")}`
    );
  }
  return warnings;
}

export function validateResponsiveSearchAd({ headlines = [], descriptions = [] }) {
  if (!Array.isArray(headlines) || headlines.length < 3) throw new Error("Responsive search ads need at least 3 headlines.");
  if (!Array.isArray(descriptions) || descriptions.length < 2) throw new Error("Responsive search ads need at least 2 descriptions.");
  headlines.forEach((headline) => {
    if (String(headline).length > 30) throw new Error(`Headline too long: ${headline}`);
  });
  descriptions.forEach((description) => {
    if (String(description).length > 90) throw new Error(`Description too long: ${description}`);
  });
}
