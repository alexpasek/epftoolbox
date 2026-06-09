export function approvalRequired(action, payload) {
  return {
    ok: true,
    mode: "dry_run",
    requiresApproval: true,
    action,
    proposedChange: payload,
    message: "Review this proposed Google Ads change. Call again with apply: true only after approval.",
  };
}

export function suggestChanges(action, payload) {
  return approvalRequired(action, payload);
}

export function applied(action, result) {
  return {
    ok: true,
    mode: "applied",
    requiresApproval: false,
    action,
    result,
  };
}

export function applyChangesAfterApproval(action, result) {
  return applied(action, result);
}

export function ensureApplyApproved(apply) {
  return Boolean(apply);
}

export function requireExactApproval(approvalText, expectedText) {
  if (approvalText !== expectedText) {
    throw new Error(`Exact approval required: approvalText must be "${expectedText}".`);
  }
}
