import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { assertMcpAuthorized, authMode, writeActionsEnabled } from "./workerGoogleAdsClient.js";
import { registerGoogleAdsResources } from "./googleAdsResources.js";
import { checkGoogleAdsMcpSource } from "./sourceMonitor.js";
import { workerTools } from "./workerTools.js";
import { textResult } from "./utils/format.js";

const INSTRUCTIONS =
  "EPF Google Ads MCP controls a live Google Ads account. Read and suggest tools may run directly. Mutations require a dry-run proposal first, then apply=true and exact approvalText. Never delete resources. New campaigns, ad groups, and ads are PAUSED.";
const GENERIC_OUTPUT_SCHEMA = { result: z.any() };

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function createServer(env) {
  const server = new McpServer({
    name: "epf-google-ads-mcp",
    version: "0.1.0",
    instructions: INSTRUCTIONS,
  });
  registerGoogleAdsResources(server);

  for (const tool of workerTools(env)) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.schema.shape,
        outputSchema: GENERIC_OUTPUT_SCHEMA,
        annotations: toolAnnotations(tool, env),
      },
      async (input) => {
      try {
        const result = await tool.handler(input || {});
        return result?.content ? result : textResult(result);
      } catch (error) {
        return textResult({ ok: false, tool: tool.name, error: error?.message || String(error) });
      }
      }
    );
  }

  return server;
}

function toolAnnotations(tool, env) {
  const writeTool = isWriteTool(tool.name);
  const writesEnabled = writeActionsEnabled(env);
  const readOnly = !writeTool || !writesEnabled;
  return {
    title: tool.name,
    readOnlyHint: readOnly,
    destructiveHint: readOnly ? false : isDestructiveWriteTool(tool.name),
    idempotentHint: readOnly || tool.name.startsWith("set_") || tool.name.startsWith("update_"),
    openWorldHint: false,
  };
}

function isWriteTool(name) {
  return name.endsWith("_after_approval") || /^(create_|add_|set_|update_|remove_|rename_|apply_|attach_|dismiss_|change_)/.test(name);
}

function isDestructiveWriteTool(name) {
  return /^(set_|update_|remove_|rename_|apply_|dismiss_|change_)/.test(name);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        ok: true,
        service: "epf-google-ads-mcp",
        authMode: authMode(env),
        writeActionsEnabled: writeActionsEnabled(env),
        name: "epf-google-ads-mcp",
        transport: "streamable-http",
        mcpPath: "/mcp",
      });
    }

    if (url.pathname === "/source-check") {
      return json(await checkGoogleAdsMcpSource(env));
    }

    if (url.pathname !== "/mcp") {
      return json({ ok: false, error: "Not found" }, 404);
    }

    const authError = assertMcpAuthorized(request, env);
    if (authError) return withCors(authError);

    if (request.method === "GET" && !(request.headers.get("accept") || "").includes("text/event-stream")) {
      return json({
        ok: true,
        service: "epf-google-ads-mcp",
        endpoint: "/mcp",
        transport: "streamable-http",
        message: "MCP endpoint is available. MCP clients should POST JSON-RPC or GET with Accept: text/event-stream.",
      });
    }

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    const server = createServer(env);
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    return withCors(response);
  },

  async scheduled(_event, env, _ctx) {
    try {
      const result = await checkGoogleAdsMcpSource(env);
      console.log(`Google Ads MCP source check: ${JSON.stringify(result)}`);
    } catch (error) {
      console.log(`Google Ads MCP source check failed: ${error?.message || String(error)}`);
    }
  },
};

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
