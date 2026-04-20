# React MCP SPA

A minimal React single-page app that is bundled into one HTML blob and served by an [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) server. The SPA doesn't use URL path routing — it picks which page to render by reading the current tool name from the MCP host context.

## Layout

- [packages/ui/](packages/ui/) — React + Vite SPA, built to a single-file HTML blob via `vite-plugin-singlefile`.
- [packages/mcp/](packages/mcp/) — MCP server using `@modelcontextprotocol/ext-apps/server`. Registers tools (`show-home`, `show-counter`, `show-profile`) that all point to the same `ui://` resource.

## Install

Requires Node.js ≥ 20 and [pnpm](https://pnpm.io/) ≥ 9.

```sh
pnpm install
```

## Develop the UI in isolation

```sh
pnpm run dev:ui
```

Open the printed URL (e.g. `http://localhost:5173`). The SPA detects that there's no MCP host and shows a route picker so you can preview each page.

## Build and run the MCP server

```sh
pnpm run build       # builds packages/ui → dist/index.html, then packages/mcp
pnpm run serve:mcp   # starts Streamable HTTP server on http://localhost:3001/mcp
```

For stdio transport:

```sh
pnpm --filter @react-mcp-spa/mcp run serve:stdio
```

## Exposing the server with cloudflared

Some MCP clients (including hosted ones) can't reach localhost. Use [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) to open a quick tunnel that assigns a public HTTPS URL.

Install cloudflared via your OS package manager:

```sh
# macOS (Homebrew)
brew install cloudflared

# Linux (Debian/Ubuntu)
# See https://pkg.cloudflare.com/ for the apt repo, or grab the .deb from
# https://github.com/cloudflare/cloudflared/releases

# Windows (winget)
winget install --id Cloudflare.cloudflared
```

Start the server locally:

```sh
pnpm run serve:mcp
```

In another terminal, run:

```sh
cloudflared tunnel --url http://localhost:3001
# or: pnpm run tunnel
```

`cloudflared` prints a URL like `https://<random>.trycloudflare.com`. Append `/mcp` and use it as your MCP server URL:

```
https://<random>.trycloudflare.com/mcp
```

The tunnel stays up until you kill `cloudflared`. For a stable hostname, configure a [named Cloudflare tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel/) instead of a quick tunnel.

## Packaging as a Claude Desktop extension (`.mcpb`)

The repo ships a packer that produces an installable [MCP Bundle](https://github.com/modelcontextprotocol/mcpb) for Claude Desktop. The extension runs the server over stdio — no tunnel required.

```sh
pnpm run pack:mcpb
```

This builds both packages, stages the compiled server + UI HTML + prod `node_modules` under `build/mcpb-staging/`, and invokes `mcpb pack` to produce:

```
build/react-mcp-spa.mcpb
```

To install it, double-click the `.mcpb` in Finder/Explorer (or drag it onto Claude Desktop). Claude validates the manifest and registers the server; after installation the three tools (`show-home`, `show-counter`, `show-profile`) are available and each renders its page as an inline React UI.

The bundle manifest lives at [mcpb/manifest.json](mcpb/manifest.json) — bump `version` there (and in [packages/mcp/package.json](packages/mcp/package.json)) when cutting a new extension release.

## How routing works

The SPA never reads `window.location`. Instead, [packages/ui/src/App.tsx](packages/ui/src/App.tsx) uses `useApp()` from `@modelcontextprotocol/ext-apps/react` and:

1. Reads `app.getHostContext().toolInfo.tool.name` to know which tool the host invoked — this is the "route".
2. Subscribes to `app.ontoolresult` to receive the `CallToolResult` from the server and pass it to the page as data.
3. Watches `app.onhostcontextchanged` so theme / safe-area / locale updates re-render correctly.

Adding a new page is a two-step change:

1. Register a tool in [packages/mcp/src/server.ts](packages/mcp/src/server.ts) with `_meta.ui.resourceUri` pointing at the shared `ui://react-mcp-spa/app.html` resource.
2. Add a case for the tool name in `renderRoute()` inside [packages/ui/src/App.tsx](packages/ui/src/App.tsx).
