import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { App as AppInstance, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { RouteRenderer } from "@react-mcp-spa/ui";

interface Preset {
  label: string;
  hostContext: McpUiHostContext;
  toolResult: CallToolResult;
}

const PRESETS: Preset[] = [
  {
    label: "show-home",
    hostContext: { toolInfo: { tool: { name: "show-home" } } } as McpUiHostContext,
    toolResult: { content: [{ type: "text", text: "Hello from the playground!" }] },
  },
  {
    label: "show-counter",
    hostContext: { toolInfo: { tool: { name: "show-counter" } } } as McpUiHostContext,
    toolResult: { content: [{ type: "text", text: "42" }] },
  },
  {
    label: "show-profile",
    hostContext: { toolInfo: { tool: { name: "show-profile" } } } as McpUiHostContext,
    toolResult: {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            name: "Ada Lovelace",
            email: "ada@example.com",
            bio: "Mathematician and writer.",
          }),
        },
      ],
    },
  },
];

// Pages don't touch the `app` instance today; RouteRenderer requires the prop
// so we hand in a null stub. If a future page reaches for app methods it will
// throw loudly, signalling that the playground needs a real mock.
const MOCK_APP = null as unknown as AppInstance;

export function Playground() {
  const [hostContextJson, setHostContextJson] = useState(() =>
    JSON.stringify(PRESETS[0].hostContext, null, 2),
  );
  const [toolResultJson, setToolResultJson] = useState(() =>
    JSON.stringify(PRESETS[0].toolResult, null, 2),
  );

  const parsedHostContext = useMemo(
    () => parseJson<McpUiHostContext>(hostContextJson),
    [hostContextJson],
  );
  const parsedToolResult = useMemo(
    () => parseJson<CallToolResult>(toolResultJson),
    [toolResultJson],
  );

  const applyPreset = (preset: Preset) => {
    setHostContextJson(JSON.stringify(preset.hostContext, null, 2));
    setToolResultJson(JSON.stringify(preset.toolResult, null, 2));
  };

  const toolName =
    parsedHostContext.value?.toolInfo?.tool.name ?? "(unknown)";
  const parseError = parsedHostContext.error ?? parsedToolResult.error;

  return (
    <div className="playground">
      <header className="playground-header">
        <div className="playground-title-row">
          <h1>React MCP SPA — Playground</h1>
          <div className="preset-row">
            <span className="muted">Presets:</span>
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="playground-inputs">
          <JsonInput
            label="Host context"
            hint="Drives which page the SPA renders (toolInfo.tool.name)."
            value={hostContextJson}
            onChange={setHostContextJson}
            error={parsedHostContext.error}
          />
          <JsonInput
            label="Tool result"
            hint="Passed to the page as its CallToolResult."
            value={toolResultJson}
            onChange={setToolResultJson}
            error={parsedToolResult.error}
          />
        </div>
      </header>

      <section className="chat">
        <Bubble role="user">
          <p>Show me <code>{toolName}</code>.</p>
        </Bubble>

        <Bubble role="assistant">
          <p className="muted" style={{ marginTop: 0 }}>
            Here's what the SPA renders for this tool call:
          </p>
          <div className="tool-output">
            {parseError ? (
              <div className="card error-card">
                <strong>Invalid JSON</strong>
                <p className="muted" style={{ marginBottom: 0 }}>{parseError}</p>
              </div>
            ) : (
              <RouteRenderer
                app={MOCK_APP}
                hostContext={parsedHostContext.value ?? undefined}
                toolResult={parsedToolResult.value ?? null}
              />
            )}
          </div>
        </Bubble>
      </section>
    </div>
  );
}

interface JsonInputProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}

function JsonInput({ label, hint, value, onChange, error }: JsonInputProps) {
  return (
    <label className="json-input">
      <span className="json-input-label">{label}</span>
      <span className="json-input-hint muted">{hint}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={8}
        className={error ? "has-error" : undefined}
      />
      {error && <span className="json-input-error">{error}</span>}
    </label>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: ReactNode }) {
  return (
    <div className={`bubble bubble-${role}`}>
      <div className="bubble-role">{role}</div>
      <div className="bubble-body">{children}</div>
    </div>
  );
}

type ParseResult<T> = { value: T | null; error: string | null };

function parseJson<T>(text: string): ParseResult<T> {
  const trimmed = text.trim();
  if (!trimmed) return { value: null, error: null };
  try {
    return { value: JSON.parse(trimmed) as T, error: null };
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : String(e) };
  }
}
