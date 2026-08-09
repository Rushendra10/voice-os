# Coffee Tracker

A VoiceOS integration template, built by hand following
[Build with code](https://docs.voiceos.com/integrations/build-with-code).

Say **"log a flat white"** and VoiceOS records it after a confirmation card;
ask **"how's my coffee habit?"** and the notch shows a stats card with a
weekly chart; say **"that's wrong, remove two"** and it corrects the log.
Three tools, native UI, no VoiceOS internals.

## Prerequisite

[bun](https://bun.sh). That's all.

## Verify

```sh
bun add @modelcontextprotocol/sdk zod && bun verify.ts
```

## Install into VoiceOS

The docs describe **Settings → Agent Mode → Integrations → Install from
folder**, but as of VoiceOS 0.1.21 that button isn't shipped yet. Install it
as a custom MCP server instead:

1. **Apps → Custom → Create** ("Tell VoiceOS what to build")
2. Paste the launch command (the studio detects it as an MCP server):
   ```
   node /absolute/path/to/coffee-tracker/server.ts
   ```
   (`bun` isn't in the studio's allowed-binaries list; `server.ts` runs under
   both node ≥ 23.6 and bun.)
3. Send — VoiceOS connects and discovers both tools. Rename it via
   **Edit** in the app's detail sheet, and flip on **Confirm custom actions**
   so acting tools ask first. After edits to `server.ts`, toggle the app
   off/on to restart the server.

See `AGENTS.md` for the full integration contract.
