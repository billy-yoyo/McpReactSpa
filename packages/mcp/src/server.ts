import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";

// The UI bundle is copied next to the compiled server at build time, so the
// server is self-contained and ships cleanly inside a .mcpb extension bundle.
const UI_HTML = path.join(import.meta.dirname, "ui.html");

// All tools share a single UI resource. The SPA picks which page to show by
// reading the current tool name from `hostContext.toolInfo.tool.name`.
const RESOURCE_URI = "ui://react-mcp-spa/app.html";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "React MCP SPA Server",
    version: "0.0.0",
  });

  registerAppTool(
    server,
    "show-home",
    {
      title: "Show Home",
      description: "Render the home page of the SPA.",
      inputSchema: {},
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (): Promise<CallToolResult> => ({
      content: [{ type: "text", text: "Hello from the MCP server!" }],
    }),
  );

  registerAppTool(
    server,
    "show-counter",
    {
      title: "Show Counter",
      description: "Render the counter page, seeded with a starting value.",
      inputSchema: {},
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (): Promise<CallToolResult> => ({
      content: [{ type: "text", text: String(Math.floor(Math.random() * 10)) }],
    }),
  );

  registerAppTool(
    server,
    "show-profile",
    {
      title: "Show Profile",
      description: "Render the profile page.",
      inputSchema: {},
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            name: "Ada Lovelace",
            email: "ada@example.com",
            bio: "First programmer.",
          }),
        },
      ],
    }),
  );

  registerAppResource(
    server,
    RESOURCE_URI,
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(UI_HTML, "utf-8");
      return {
        contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    },
  );

  return server;
}
