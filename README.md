# voice-os

VoiceOS integration templates. Each top-level folder is a standalone
[VoiceOS](https://docs.voiceos.com/integrations) integration — an MCP stdio
server plus a manifest — that adds voice tools with native cards in the Mac
notch.

| Folder | What it does |
| --- | --- |
| [`coffee-tracker/`](coffee-tracker/) | The docs' [Build with code](https://docs.voiceos.com/integrations/build-with-code) walkthrough: log coffees by voice, glance your stats, undo mistakes |
| [`convex-notify/`](convex-notify/) | Cross-laptop robot request/approval on a shared Convex backend: one person requests, the other gets a notification and approves or declines by voice |

## Prerequisites

- **VoiceOS** installed (these templates were built against 0.1.21)
- **[bun](https://bun.sh)** (`brew install oven-sh/bun/bun`) — runs the
  servers and dev loops. `coffee-tracker` also runs under plain node ≥ 23.6.

## Installing an integration into VoiceOS

The docs describe **Settings → Agent Mode → Integrations → Install from
folder**, but VoiceOS 0.1.21 doesn't ship that button yet. What works today:

1. Open VoiceOS → **Apps** (sidebar) → **Custom** tab → **Create**.
2. In the "Tell VoiceOS what to build" box, paste a **launch command** for
   the integration — the studio detects it as an MCP server and connects it:

   ```sh
   # coffee-tracker (run `bun add @modelcontextprotocol/sdk zod` in the folder first)
   node /absolute/path/to/coffee-tracker/server.ts

   # convex-notify
   /bin/zsh /absolute/path/to/convex-notify/run.sh
   ```

   The first word must be one of `npx uvx bunx pnpx node deno docker` or a
   shell — bare `bun` isn't accepted.
3. After it connects: open the app's detail sheet to **rename** it, flip on
   **Confirm custom actions** (acting tools then ask before running), and
   fill in any **Setup** fields. Type or paste into setup fields — they save
   on real keyboard events.
4. After editing server code, toggle the app off/on to restart its server.

## Setting up `convex-notify` (each teammate)

The shared backend is already deployed at
`https://hushed-pony-700.convex.cloud`
([dashboard](https://dashboard.convex.dev/t/shiva-raisinghani/convex-notify)) —
you don't need a Convex account to use it, only to redeploy it.

1. Install the integration (above) and set its Setup fields:
   - **Deployment URL**: `https://hushed-pony-700.convex.cloud`
   - **VoiceOS user ID**: your handle, e.g. `rush` — unique per person; this
     is how requests are addressed ("send a robot to *rush*'s table")
   - Leave the function-path fields at their defaults.
2. To receive requests as notifications, keep the watcher running:

   ```sh
   cd convex-notify
   CONVEX_DEPLOYMENT_URL=https://hushed-pony-700.convex.cloud \
   VOICEOS_USER_ID=<your-id> bun notify-watcher.ts
   ```

3. Try it end to end (two people, or send to yourself):
   - Sender: *"send a robot to rush's table 12"* → approve the card
   - Recipient: notification pops → *"any robot requests?"* → *"approve it"*
   - Sender: *"what's the status of my robot request?"* → approved

Backend changes: edit `convex-notify/backend/convex/`, then
`cd convex-notify/backend && bun install && npx convex deploy` (needs Convex
access to the `shiva-raisinghani` team).

## Development loop

- `coffee-tracker`: edit `server.ts`, then `bun verify.ts` — it speaks real
  MCP to the server and checks manifest/tool parity and glance cards, the
  same way VoiceOS does.
- `convex-notify`: `bun server.ts` starts the server directly (Ctrl-C when
  idle); `AGENTS.md` in the folder teaches AI coding agents the full
  integration contract.
- Details and per-template docs live in each folder's `README.md`.
