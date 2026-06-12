#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { registerGoogleAdsResources } from "./googleAdsResources.js";
import { textResult } from "./utils/format.js";
import { workerTools } from "./workerTools.js";

const server = new McpServer({
  name: "epf-google-ads-mcp",
  version: "0.1.0",
  instructions:
    "EPF Google Ads MCP controls a live Google Ads account. Read and suggest tools may run directly. Any mutation must first return a dry-run proposal, then only apply when apply=true and approvalText exactly matches the tool requirement. Never delete resources. New campaigns, ad groups, ads, and keywords default to PAUSED.",
});
const GENERIC_OUTPUT_SCHEMA = { result: z.any() };
registerGoogleAdsResources(server);

const tools = workerTools(process.env);

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
  const writeTool = isWriteTool(name);
  return {
    title: name,
    readOnlyHint: !writeTool,
    destructiveHint: writeTool ? isDestructiveWriteTool(name) : false,
    idempotentHint: !writeTool || name.startsWith("set_") || name.startsWith("update_"),
    openWorldHint: false,
  };
}

function isWriteTool(name) {
  return name.endsWith("_after_approval") || /^(create_|add_|set_|update_|remove_|rename_|apply_|attach_|dismiss_|change_)/.test(name);
}

function isDestructiveWriteTool(name) {
  return /^(set_|update_|remove_|rename_|apply_|dismiss_|change_)/.test(name);
}
