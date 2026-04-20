import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as AppInstance, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useEffect, useState } from "react";
import { RouteRenderer, renderRoute } from "./Router.tsx";

// In dev mode under `vite dev`, there is no parent window to initialize with.
// Skip the MCP handshake entirely so developers can iterate on the UI.
const HAS_HOST = typeof window !== "undefined" && window.parent !== window;

export function App() {
  if (!HAS_HOST) return <StandaloneDevShell />;
  return <HostedApp />;
}

function HostedApp() {
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "React MCP SPA", version: "0.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (result) => setToolResult(result);
      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
      app.onerror = (e) => console.error("[mcp-app]", e);
    },
  });

  useEffect(() => {
    if (app) setHostContext(app.getHostContext());
  }, [app]);

  if (error) return <ErrorShell message={error.message} />;
  if (!app) return <ConnectingShell />;

  return <Shell app={app} hostContext={hostContext} toolResult={toolResult} />;
}

interface ShellProps {
  app: AppInstance;
  hostContext: McpUiHostContext | undefined;
  toolResult: CallToolResult | null;
}

function Shell({ app, hostContext, toolResult }: ShellProps) {
  const toolName = hostContext?.toolInfo?.tool.name;
  const insets = hostContext?.safeAreaInsets;

  const style = insets
    ? {
        paddingTop: insets.top,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
      }
    : undefined;

  return (
    <main style={style}>
      <nav className="muted" style={{ marginBottom: "0.5rem" }}>
        <span className="badge">route: {toolName ?? "(unknown)"}</span>
      </nav>
      <RouteRenderer app={app} hostContext={hostContext} toolResult={toolResult} />
    </main>
  );
}

function ConnectingShell() {
  return (
    <main>
      <p className="muted">Connecting to MCP host…</p>
    </main>
  );
}

function ErrorShell({ message }: { message: string }) {
  return (
    <main>
      <div className="card">
        <h1>Failed to connect</h1>
        <p className="muted">{message}</p>
      </div>
    </main>
  );
}

function StandaloneDevShell() {
  const [route, setRoute] = useState<string>("show-home");
  const fakeApp = null as unknown as AppInstance;

  return (
    <main>
      <nav className="muted" style={{ marginBottom: "0.5rem" }}>
        <span className="badge">dev mode — no MCP host</span>
      </nav>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Pick a route to preview. In production, the route is chosen by which MCP
          tool the host invokes (read from <code>hostContext.toolInfo.tool.name</code>).
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["show-home", "show-counter", "show-profile"].map((name) => (
            <button key={name} onClick={() => setRoute(name)} disabled={route === name}>
              {name}
            </button>
          ))}
        </div>
      </div>
      {renderRoute(route, { app: fakeApp, toolResult: null })}
    </main>
  );
}
