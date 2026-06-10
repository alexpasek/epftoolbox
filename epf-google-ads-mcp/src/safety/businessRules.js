export const epfServices = [
  "Popcorn Ceiling Removal",
  "Ceiling Refinishing",
  "Drywall Repair",
  "Interior Painting",
  "Wallpaper Removal",
  "Skim Coating",
  "Ceiling Repair",
];

export const epfLocations = [
  "Mississauga",
  "Oakville",
  "Burlington",
  "Hamilton",
  "Etobicoke",
  "Toronto",
  "Milton",
  "Stoney Creek",
  "Grimsby",
  "St. Catharines",
];

export const lowIntentKeywordFragments = [
  "how to remove popcorn ceiling",
  "diy",
  "diy popcorn ceiling removal",
  "popcorn ceiling tools",
  "cheapest",
  "free",
  "job",
  "jobs",
  "salary",
  "training",
  "course",
];

export const negativeFlagFragments = [
  "diy",
  "free",
  "job",
  "jobs",
  "salary",
  "course",
  "training",
  "tools",
  "spray can",
  "asbestos test only",
  "home depot",
  "rental equipment",
];

export const highIntentKeywordExamples = [
  "popcorn ceiling removal mississauga",
  "popcorn ceiling removal near me",
  "ceiling refinishing mississauga",
  "drywall repair mississauga",
  "interior painting mississauga",
];

export const epfSellingPoints = [
  "Popcorn ceiling removal",
  "Smooth ceiling finish",
  "Painted popcorn removal",
  "Dust control / minimal mess",
  "HEPA vacuum sanding",
  "Floor and wall protection",
  "Primer and ceiling paint",
  "3-year workmanship warranty",
  "Free estimate / quote",
];

export const epfSuggestedCallouts = [
  "Dust Controlled Process",
  "Smooth Ceiling Finish",
  "Free Estimates",
  "3-Year Workmanship Warranty",
  "Floor Protection Included",
  "HEPA Vacuum Sanding",
];

export const epfSuggestedSitelinks = [
  "Popcorn Ceiling Removal",
  "Painted Popcorn Removal",
  "Mississauga Service Area",
  "Get a Free Quote",
  "Interior Painting",
  "Drywall Repair",
];

export function campaignNameFor(service, city) {
  return `EPF - ${service} - ${city}`;
}

export function includesFragment(value = "", fragments = []) {
  const clean = String(value || "").toLowerCase();
  return fragments.find((fragment) => clean.includes(fragment));
}

export function keywordIntentWarning(keyword) {
  const match = includesFragment(keyword, lowIntentKeywordFragments);
  return match ? `Low-intent keyword fragment detected: "${match}"` : "";
}

export function negativeFlagReason(searchTerm) {
  const match = includesFragment(searchTerm, negativeFlagFragments);
  return match ? `Flagged by EPF negative rule: "${match}"` : "";
}
