export function textResult(data) {
  const structuredContent = { result: data };
  return {
    structuredContent,
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function cleanText(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

export function resourceName(type, customerId, id) {
  return `customers/${customerId}/${type}/${id}`;
}
