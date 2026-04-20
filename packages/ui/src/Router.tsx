import type { App as AppInstance, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { HomePage } from "./pages/HomePage.tsx";
import { CounterPage } from "./pages/CounterPage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";

export interface RouteProps {
  app: AppInstance;
  toolResult: CallToolResult | null;
}

export function renderRoute(toolName: string | undefined, props: RouteProps) {
  switch (toolName) {
    case "show-home":
      return <HomePage {...props} />;
    case "show-counter":
      return <CounterPage {...props} />;
    case "show-profile":
      return <ProfilePage {...props} />;
    default:
      return <UnknownRoute toolName={toolName} />;
  }
}

function UnknownRoute({ toolName }: { toolName: string | undefined }) {
  return (
    <div className="card">
      <h1>Unknown route</h1>
      <p className="muted">
        No page is registered for tool <code>{toolName ?? "(none)"}</code>.
      </p>
    </div>
  );
}

export interface RouteRendererProps {
  app: AppInstance;
  hostContext: McpUiHostContext | undefined;
  toolResult: CallToolResult | null;
}

export function RouteRenderer({ app, hostContext, toolResult }: RouteRendererProps) {
  const toolName = hostContext?.toolInfo?.tool.name;
  return renderRoute(toolName, { app, toolResult });
}
