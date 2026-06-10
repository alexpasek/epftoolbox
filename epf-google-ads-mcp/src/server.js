#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { adGroupTools } from "./tools/adGroups.js";
import { adTools } from "./tools/ads.js";
import { campaignTools } from "./tools/campaigns.js";
import { controlTools } from "./tools/control.js";
import { negativeTools } from "./tools/negatives.js";
import { optimizationTools } from "./tools/optimization.js";
import { reportingTools } from "./tools/reporting.js";
import { textResult } from "./utils/format.js";

const server = new McpServer({
  name: "epf-google-ads-mcp",
  version: "0.1.0",
  instructions:
    "EPF Google Ads MCP controls a live Google Ads account. Read and suggest tools may run directly. Any mutation must first return a dry-run proposal, then only apply when apply=true and approvalText exactly matches the tool requirement. Never delete resources. New campaigns, ad groups, ads, and keywords default to PAUSED.",
});
const GENERIC_OUTPUT_SCHEMA = { result: z.any() };

const tools = [
  ...reportingTools,
  ...campaignTools,
  ...adGroupTools,
  ...adTools,
  ...negativeTools,
  ...optimizationTools,
  ...controlTools,
];

for (const tool of tools) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.schema.shape,
      outputSchema: GENERIC_OUTPUT_SCHEMA,
      annotations: toolAnnotations(tool.name),
    },
    async (input) => {
    try {
      const result = await tool.handler(input);
      return result?.content ? result : textResult(result);
    } catch (error) {
      return textResult({
        ok: false,
        tool: tool.name,
        error: error?.message || String(error),
      });
    }
    }
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);

function toolAnnotations(name) {
  const writeTool = /^(create_|add_|set_|update_)/.test(name);
  return {
    title: name,
    readOnlyHint: !writeTool,
    destructiveHint: writeTool ? /^(set_|update_)/.test(name) : false,
    idempotentHint: !writeTool || name.startsWith("set_") || name.startsWith("update_"),
    openWorldHint: false,
  };
}
