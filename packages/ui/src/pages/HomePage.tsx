import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

interface HomePageProps {
  app: App;
  toolResult: CallToolResult | null;
}

export function HomePage({ toolResult }: HomePageProps) {
  const text = firstText(toolResult) ?? "(no greeting from server yet)";

  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the React MCP SPA.</p>
      <div className="card">
        <strong>Server said:</strong>
        <p style={{ margin: "0.5rem 0 0" }}>{text}</p>
      </div>
    </div>
  );
}

function firstText(result: CallToolResult | null): string | null {
  if (!result) return null;
  const first = result.content?.find((c) => c.type === "text");
  return first && first.type === "text" ? first.text : null;
}
