export function dollarsToMicros(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Money amount must be a positive number.");
  }
  return Math.round(amount * 1_000_000);
}

export function microsToDollars(value) {
  const micros = Number(value || 0);
  return micros / 1_000_000;
}

export function formatMoneyFromMicros(value, currency = "CAD") {
  return microsToDollars(value).toLocaleString("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}
