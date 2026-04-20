#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function startStdio(): Promise<void> {
  await createServer().connect(new StdioServerTransport());
}

// HTTP transport is loaded lazily so stdio-only deployments (e.g. the .mcpb
// extension) don't need to ship express/cors/@hono/node-server.
async function startHttp(): Promise<void> {
  const [{ createMcpExpressApp }, { StreamableHTTPServerTransport }, corsMod] =
    await Promise.all([
      import("@modelcontextprotocol/sdk/server/express.js"),
      import("@modelcontextprotocol/sdk/server/streamableHttp.js"),
      import("cors"),
    ]);
  const cors = corsMod.default;
  const port = Number.parseInt(process.env.PORT ?? "3001", 10);
  const app = createMcpExpressApp({ host: "0.0.0.0" });
  app.use(cors());

  app.all("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.listen(port, () => {
    console.log(`MCP server listening on http://localhost:${port}/mcp`);
  });
}

async function main(): Promise<void> {
  if (process.argv.includes("--stdio")) {
    await startStdio();
  } else {
    await startHttp();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
