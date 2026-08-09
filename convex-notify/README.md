# Convex Notify

A VoiceOS integration for robot request-and-approval across two laptops,
backed by a shared [Convex](https://convex.dev) deployment.

A **sender** says *"send a robot to Rush's table"* → a pending request lands
in Convex → the **recipient's** laptop pops a native notification → the
recipient says *"approve the robot request"* in VoiceOS → the decision is
recorded atomically and a `dispatches` row is written (the hook for real
robot-fleet automation).

## Layout

| Path | What it is |
| --- | --- |
| `server.ts`, `run.sh`, `voiceos.integration.json`, `widgetKit.ts` | The VoiceOS integration (Studio-built, MCP over stdio) |
| `backend/` | The Convex backend: `robotRequests` schema + `list/get/create/respond` functions |
| `notify-watcher.ts` | Poller for the recipient's laptop — fires a macOS notification on new pending requests |

## Backend

Deployed at `https://hushed-pony-700.convex.cloud` (prod). To redeploy after
edits:

```sh
cd backend && bun install && npx convex deploy
```

`respond` validates atomically: only the recipient may respond, only while
the request is still pending, and an approval inserts into `dispatches` in
the same transaction.

## Setup (each laptop)

1. Install the integration folder in VoiceOS (Studio-built installs land in
   **Apps → Custom → My Apps**; see the coffee-tracker README for the
   folder-install state of play).
2. In the integration's **Configure** form set:
   - **Deployment URL** — `https://hushed-pony-700.convex.cloud`
   - **VoiceOS user ID** — a stable handle, unique per person (e.g. `shiva`,
     `rush`). This is how requests are addressed.
   - Leave the function-path fields at their defaults.
3. Recipient only — run the watcher so requests arrive as notifications:

   ```sh
   CONVEX_DEPLOYMENT_URL=https://hushed-pony-700.convex.cloud \
   VOICEOS_USER_ID=rush bun notify-watcher.ts
   ```

## The two-laptop test

1. **Laptop A (sender, `shiva`)**: *"Send a robot to rush's table 12"* →
   confirmation card → approve → "Approval requested" card.
2. **Laptop B (recipient, `rush`)**: watcher pops *"shiva wants to send Robot
   to Table 12"* within ~5 s.
3. **Laptop B**: *"any robot requests?"* → pending card → *"approve it"* →
   confirmation card → approve → "Robot approved / Dispatch authorized".
4. **Laptop A**: *"what's the status of my robot request?"* → outgoing list
   shows **approved**; the `dispatches` table on the
   [Convex dashboard](https://dashboard.convex.dev/t/shiva-raisinghani/convex-notify)
   has the dispatch row.

Declining works the same way — the card shows "No dispatch" and no
`dispatches` row is written.
