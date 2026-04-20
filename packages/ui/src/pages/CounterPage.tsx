import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useState } from "react";

interface CounterPageProps {
  app: App;
  toolResult: CallToolResult | null;
}

export function CounterPage({ toolResult }: CounterPageProps) {
  const initial = parseInitial(toolResult);
  const [count, setCount] = useState(initial);

  return (
    <div>
      <h1>Counter</h1>
      <p className="muted">
        Initial count seeded from the tool result ({initial}).
      </p>
      <div className="card">
        <p style={{ fontSize: "2rem", margin: 0 }}>{count}</p>
        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setCount((n) => n - 1)}>−</button>
          <button onClick={() => setCount((n) => n + 1)}>+</button>
        </div>
      </div>
    </div>
  );
}

function parseInitial(result: CallToolResult | null): number {
  if (!result) return 0;
  const text = result.content?.find((c) => c.type === "text");
  if (!text || text.type !== "text") return 0;
  const n = Number.parseInt(text.text, 10);
  return Number.isFinite(n) ? n : 0;
}
