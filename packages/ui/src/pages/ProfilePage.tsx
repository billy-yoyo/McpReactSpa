import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

interface ProfilePageProps {
  app: App;
  toolResult: CallToolResult | null;
}

interface Profile {
  name?: string;
  email?: string;
  bio?: string;
}

export function ProfilePage({ toolResult }: ProfilePageProps) {
  const profile = parseProfile(toolResult);

  return (
    <div>
      <h1>Profile</h1>
      <div className="card">
        <p style={{ marginTop: 0 }}>
          <strong>Name:</strong> {profile?.name ?? "—"}
        </p>
        <p>
          <strong>Email:</strong> {profile?.email ?? "—"}
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Bio:</strong> {profile?.bio ?? "—"}
        </p>
      </div>
    </div>
  );
}

function parseProfile(result: CallToolResult | null): Profile | null {
  if (!result) return null;
  const text = result.content?.find((c) => c.type === "text");
  if (!text || text.type !== "text") return null;
  try {
    return JSON.parse(text.text) as Profile;
  } catch {
    return null;
  }
}
