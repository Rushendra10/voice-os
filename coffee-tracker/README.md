# Coffee Tracker

A VoiceOS integration template, built by hand following
[Build with code](https://docs.voiceos.com/integrations/build-with-code).

Say **"log a flat white"** and VoiceOS records it after a confirmation card;
ask **"how's my coffee habit?"** and the notch shows a stats card with a
weekly chart. Two tools, native UI, no VoiceOS internals.

## Prerequisite

[bun](https://bun.sh). That's all.

## Verify

```sh
bun add @modelcontextprotocol/sdk zod && bun verify.ts
```

## Install into VoiceOS

**Settings → Agent Mode → Integrations → Install from folder**, then pick
this folder. After edits, hit **Reload** on the integration.

See `AGENTS.md` for the full integration contract.
