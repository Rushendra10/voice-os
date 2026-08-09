# Coffee Tracker — VoiceOS integration contract

This folder is a complete, standalone VoiceOS integration. It imports nothing
from the integration SDK — the one glance helper it needs is inlined in
`server.ts`. Everything an agent needs to extend it is in this file.

## Files

| File | Role |
| --- | --- |
| `voiceos.integration.json` | Manifest: identity, runtime, and the `tools` array VoiceOS routes on |
| `server.ts` | Standard MCP stdio server implementing the tools |
| `verify.ts` | Smoke test — run `bun verify.ts` after every change |
| `voiceos.integration.preview.json` | Sample inputs used by verify and the Integration Studio preview |

## The contract

1. **Descriptions are routing rules.** The agent reads each tool's
   `description` to decide when to call it — say *what it does* and *when to
   use it*. Every tool must have one.

2. **Acting tools declare a `confirmation`; read-only tools must not.** The
   confirmation is data, not code — it renders before your server runs.
   `{{argName}}` binds a field to the tool argument; whatever the user edits
   it to is what your handler receives.

3. **Every result carries data for the model *and* a card for the user.**
   Return JSON for the model (via `jsonResult`) and spread
   `glanceResult([...])` into it for the card shown in the notch. Never put
   information only in the card — the model narrates from the JSON.

4. **Cards are 1–3 glance blocks.** `glanceResult` throws outside that range.
   Available block types include `header`, `keyValue`, `stats`, and `bars`.

5. **Preview fixtures must cover every tool.** Map each tool name to `args`
   and `expectedGlanceBlocks` in `voiceos.integration.preview.json`.

## Feedback loop

```sh
bun add @modelcontextprotocol/sdk zod && bun verify.ts
```

`verify.ts` speaks real MCP over stdio to `server.ts` exactly the way VoiceOS
does — handshake, `tools/list`, then a `tools/call` per preview fixture. All
checks must print `✓`. Run it after every change.

## Installing

In VoiceOS: **Settings → Agent Mode → Integrations → Install from folder**,
then pick this folder. After later edits, hit the integration's **Reload** —
it re-reads the manifest and restarts the server; tools update on the next
turn.
