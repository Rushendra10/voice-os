# Person 2 — VoiceOS Control Plane

You own the spoken requester experience: installation, routing, confirmation,
background execution, exact-mission monitoring, native result cards, and the
synchronous recovery tool. Develop entirely against a frozen backend fixture
until Person 1's live `.convex.site` deployment is ready.

Read first:

1. `global-plan.md`, especially **Frozen contract v2** and the demo script.
2. `docs/SPEC.md`.
3. `docs/EVALS.md`.
4. `coffee-tracker/AGENTS.md` only for the pulled scaffold's MCP mechanics and
   verifier. This brief and `global-plan.md` override its synchronous-tool
   assumptions.

Person 3 owns every projected pixel. Coordinate only through the frozen
`WorldSnapshot` terminology and the demo clock; do not wait on the dashboard.

## Your exclusive files

```text
integrations/runner/**
coffee-tracker/**   # temporary hour-zero probe/template only
```

You may copy/adapt `coffee-tracker/**` mechanics into `integrations/runner/**`.
Keep the temporary probe and final RUNNER install as separate immutable IDs,
then disable/uninstall the probe before rehearsal.

Do not edit:

```text
package.json
bun.lock
convex.json
.env.example
convex/**
packages/contracts/**
apps/john-terminal/**
apps/dashboard/**
scripts/reset-demo.ts
```

Person 1 owns root packages and lockfiles; Person 3 owns `apps/dashboard/**`.
Keep integration dependencies inside your owned directories until integration.

## Your deliverable

By the 2:30 checkpoint:

- VoiceOS verifies one background acting tool and one synchronous read tool.
- Fixture dispatch progresses to a terminal state and produces exactly one
  final native card.
- The installed integration has passed a realistic 25–30 second fixture run.
- The live adapter is pointed at Person 1's authenticated HTTP actions.

By the 3:30 checkpoint, the exact spoken request must dispatch the live mission
and VoiceOS must visibly open the final delivered card without another
utterance.

## Minute-by-minute plan

### 0:00–0:30 — Kill-risk proof

- Install Bun on the requester/VoiceOS Mac and make `bun --version` pass. Bun is
  currently absent in this workspace.
- In the pulled `coffee-tracker` scaffold:
  - install existing dependencies if needed;
  - replace one disposable scaffold tool with the two-second confirmed
    background probe;
  - add `background` and `notify`, then run `bun verify.ts`;
  - install the folder once, accepting the new permissions;
  - use one spoken phrase to invoke that probe, proving install, routing, Bun,
    background handling, and the final card together.
- Confirm the VoiceOS-launched process can run `bun` from the GUI environment,
  not just from an interactive shell.
- In installed VoiceOS, prove twice that confirmation starts tracked background
  work and that the host visibly opens the final card without a second request.
- Cancel once and prove the fixture handler/mock dispatch was never called.

If folder installation or spoken routing is blocked at minute 30, stop and fix
it. If documented background completion itself is not working at minute
30, freeze the synchronous `mission_status` fallback and ask the VoiceOS team;
do not spend the hackathon inventing a push API.

If the team explicitly activates that degraded contingency, change
`dispatch_errand` to synchronous, keep its confirmation, return the initial
outbound card with `monitorOutcome: "not_applicable"` immediately after the one
dispatch POST, and retain only the exact `network` permission. The primary demo
then ends with `mission_status`. Do not mix this fallback lifecycle with the
background monitor described below.

In degraded mode, use 0:30–1:00 for the synchronous tools and 1:00–1:30 for
confirmation/error/status tests; skip the realistic background-lifetime proof.

### 0:30–1:00 — RUNNER VoiceOS fixture implementation

- Copy/adapt the scaffold mechanics into `integrations/runner`.
- Treat the probe and RUNNER as separate installs: create
  `integrations/runner` with its frozen `com.rushendra.runner` ID rather than
  changing the installed probe's ID in place.
- Replace Coffee Tracker identity, tools, handlers, preview fixtures, and docs.
- Implement `server.ts --fixture`; `verify.ts` must launch that mode.
- Implement `dispatch_errand` and `mission_status` exactly as below.
- Make fixture dispatch advance through one exact-mission polling sequence and
  return only after `delivered`.
- Use native three-block glance cards.

### 1:00–1:15 — Verifier and pure monitor tests

- Run the full fixture verifier.
- Test delivered, denied, failed, fatal-error, retryable-error, unknown-ID, and
  shortened-deadline monitor sequences.
- Assert one dispatch POST, the exact returned mission ID on every GET, one MCP
  result, three valid glance blocks, and zero secret leakage.

### 1:15–1:30 — Installed realistic-duration proof

- Install RUNNER separately with its frozen `com.rushendra.runner` ID.
- Run one installed 25–30 second fixture; the hour-zero two-second probe is not
  sufficient for process-lifetime risk.
- Confirm the final card visibly opens, record whether the chime plays, and
  disable/uninstall the temporary Coffee probe.
- Send Person 1 the nested typecheck/test/lint/verify command names for root
  script wiring.

### 1:30–2:30 — Connect live Convex HTTP

- Point the VoiceOS HTTP adapter at `RUNNER_API_URL`.
- Add the exact `.convex.site` hostname to the manifest network permission.
- Configure `RUNNER_REQUESTER_TOKEN` through VoiceOS's secure setup field.
- Because adding/changing permissions may require approval, reinstall the
  integration if a reload does not present and grant the exact live domain.
- Exercise dispatch and both status modes against Person 1's deployment.
- Test error-envelope sanitization and confirm tokens never enter results/logs.

### 2:30–3:10 — Live end-to-end integration

- Reload/reinstall RUNNER with the final live domain and setup values.
- Reset through Person 1, invoke live dispatch, have John decide, and let the
  exact-ID monitor reach the terminal card once.
- Coordinate with Person 3 only to confirm the dashboard shows the same phase,
  holder, and terminal facts; do not edit their UI.
- Fix only adapter, permission, confirmation, or card contract failures.

### 3:10–3:30 — Spoken vertical slice

- Reload the VoiceOS integration.
- Reset the world.
- Speak the exact judged dispatch sentence.
- Approve by voice.
- Have John approve and complete the return.
- Wait for VoiceOS to visibly open the background `DELIVERED` card
  automatically.

If degraded mode was activated at minute 30, this gate instead proves: spoken
confirmed synchronous dispatch creates the mission, John approves, and the
spoken `mission_status` fallback returns the delivered card.

Do not begin further polish until this real path succeeds once.

### 3:30–4:10 — VoiceOS reliability and card polish

- Test `N` once and confirm it produces an honest denied result.
- Verify distinct native delivered and denied completion cards.
- Verify `mission_status` while a background dispatch is still waiting and
  after it finishes.
- Recheck confirmation cancellation, **Asks first**, permissions, setup-field
  injection, and the second-63 status recovery line.

### 4:10–5:00 — Feature freeze and demo

- No new features after 4:10.
- Rehearse the exact 75-second script three times from reset.
- Record a clean backup/social video.
- Fix only failures observed during rehearsal.

## VoiceOS integration

Keep exactly two tools: one confirmed background acting tool and one
synchronous read-only tool. Use native result cards; Person 3's browser owns the
spectacle.

### `dispatch_errand`

Manifest definition:

```json
{
  "name": "dispatch_errand",
  "title": "Dispatch RUNNER",
  "description": "Dispatch an office courier to request a physical item from a coworker. Use when the user asks RUNNER to get, fetch, borrow, pick up, or bring an item from a named person. Do not use for questions about an existing mission.",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "item": {
        "type": "string",
        "minLength": 1,
        "maxLength": 80,
        "description": "The physical item to retrieve, such as USB-C charger."
      },
      "fromPerson": {
        "type": "string",
        "minLength": 1,
        "maxLength": 60,
        "description": "The coworker who currently has the item, such as John."
      }
    },
    "required": ["item", "fromPerson"]
  },
  "execution": {
    "mode": "background",
    "estimatedDurationMs": 30000
  },
  "confirmation": {
    "schemaVersion": 1,
    "root": {
      "type": "card",
      "title": "Dispatch RUNNER?",
      "children": [
        {
          "type": "text",
          "text": "Send the courier to {{fromPerson}} to request {{item}}. The item moves only after the recipient approves."
        },
        {
          "type": "textField",
          "bind": "{{item}}",
          "label": "Item",
          "required": true
        },
        {
          "type": "textField",
          "bind": "{{fromPerson}}",
          "label": "From",
          "required": true
        }
      ],
      "footer": [
        {
          "type": "actions",
          "items": [
            { "label": "Cancel", "role": "cancel" },
            {
              "label": "Dispatch courier",
              "role": "confirm",
              "color": "accent"
            }
          ]
        }
      ]
    }
  }
}
```

Confirmation:

- Title: `Dispatch RUNNER?`
- Text: `Send the courier to {{fromPerson}} to request {{item}}. The item moves
  only after the recipient approves.`
- Required editable fields bound to `{{item}}` and `{{fromPerson}}`.
- Actions: `Cancel` and `Dispatch courier`.

The handler:

1. Canonicalizes `John` and `USB-C charger` case-insensitively to the fixed
   slugs.
2. Rejects unsupported people/items honestly.
3. Generates a stable opaque `clientRequestId` per invocation.
4. Calls `POST /api/v1/voiceos/dispatch` with a five-second timeout.
5. Throws the sanitized backend message on non-success and never redispatches.
6. Captures `snapshot.mission.id`; a missing ID is a contract failure.
7. Starts a monotonic 90-second deadline when that successful response yields
   the ID, then polls
   `GET /api/v1/voiceos/status?missionId=<encodeURIComponent(missionId)>` every
   500–750 ms, always using that same ID.
8. Clamps each fetch timeout and sleep to the remaining deadline; never starts
   another attempt after the clock expires.
9. Retries only network/timeouts and backend error envelopes with
   `retryable: true`. It immediately fails on `400`, `401`, `404`, `409`, any
   `retryable: false` response, and `MISSION_NOT_FOUND`.
10. On `delivered`, `denied`, or `failed`, stops polling and returns exactly one
   `VoiceOSToolResult` with `monitorOutcome: "terminal"` plus three native
   glance blocks.
11. At the 90-second deadline, stops polling and returns the last honest
    snapshot with `monitorOutcome: "deadline"` and a nonterminal card such as
    `AWAITING JOHN`. It does not cancel the Convex mission or claim completion.

Do not construct or return a custom task handle. VoiceOS owns the background
handle and completion presentation. Do not return an initial outbound result
followed by another result; this invocation has one final MCP result, while
Person 3's dashboard supplies immediate visual progress.

Backend adapter rules:

- Read `RUNNER_API_URL` and `RUNNER_REQUESTER_TOKEN` from VoiceOS-injected env;
  fail with setup guidance if either is absent.
- Normalize one trailing slash and require an `https://*.convex.site` URL.
- Send `Authorization: Bearer <token>` on dispatch and status, and
  `Content-Type: application/json` on dispatch.
- Dispatch sends the exact v2 request body frozen in `global-plan.md`; status
  has no request body.
- Parse `SuccessEnvelope | ErrorEnvelope`, expose only sanitized error messages,
  and never log or return the token.

### `mission_status`

Manifest definition:

```json
{
  "name": "mission_status",
  "title": "Mission status",
  "description": "Read the active or most recent RUNNER mission, including the courier location, item holder, progress, and latest event. Use when the user asks where the courier or item is, whether the errand is done, or what is happening.",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

This read-only synchronous tool has no confirmation. It calls
`GET /api/v1/voiceos/status` without `missionId` and returns a
`VoiceOSToolResult` with `monitorOutcome: "not_applicable"` plus the same card
shape. It remains usable while a background dispatch is waiting and after a
monitor deadline or integration restart.

## VoiceOS manifest setup

- Stable integration ID: `com.rushendra.runner`; do not change it after the
  first install.
- Runtime: `bun server.ts`.
- Identity/configuration fields:

  ```json
  "schemaVersion": 1,
  "id": "com.rushendra.runner",
  "version": "1.0.0",
  "name": "RUNNER",
  "summary": "Dispatch a consent-aware office courier by voice.",
  "publisher": { "id": "pub_runner_team", "name": "RUNNER Team" },
  "runtime": { "kind": "local-mcp", "command": "bun", "args": ["server.ts"] },
  "auth": {
    "kind": "apiKey",
    "fields": [
      {
        "key": "RUNNER_REQUESTER_TOKEN",
        "label": "RUNNER requester token",
        "secret": true,
        "required": true
      }
    ]
  },
  "preferences": [
    {
      "name": "RUNNER_API_URL",
      "title": "RUNNER API URL",
      "description": "The exact https://<deployment>.convex.site URL from the RUNNER backend.",
      "type": "text",
      "required": true
    }
  ]
  ```

- Top-level permissions must be exactly sufficient for this lifecycle:

  ```json
  "permissions": [
    { "kind": "background" },
    { "kind": "notify" },
    { "kind": "network", "domains": ["<deployment>.convex.site"] }
  ]
  ```

- Replace the domain placeholder with Person 1's exact hostname before the live
  run; no wildcard remains in the final manifest.
- Publisher/name/icon should read RUNNER, not Coffee Tracker.
- Do not add `@voiceos/integration-sdk`; the pulled scaffold is standalone.
- Do not add `webhook`: it is reserved. `background` permits background tool
  execution; `notify` grants completion notifications and opening the side
  notch. Neither is an API for Convex to push arbitrary cards.

## Native card mapping

Every result includes the full `VoiceOSToolResult` JSON for the model and
exactly these three glance blocks for the user:

At the wire boundary, spread `_voiceos_glance` beside the
`VoiceOSToolResult`; do not add it to the shared DTO. VoiceOS strips that field
before the model reads the JSON.

```ts
[
  {
    type: "header",
    title: "RUNNER",
    icon: "car",
    trailing: phaseLabel
  },
  {
    type: "keyValue",
    pairs: [
      ["Item", snapshot.item.name],
      ["Location", snapshot.mission?.locationLabel ?? "Rushendra's desk"],
      ["Holder", snapshot.item.holder.displayName],
      ["Latest", snapshot.events.at(-1)?.message ?? "Ready"]
    ]
  },
  {
    type: "progress",
    value: snapshot.mission?.progressPercent ?? 0,
    max: 100,
    label: monitorOutcome === "deadline"
      ? `${phaseLabel} · ASK FOR STATUS`
      : phaseLabel,
    tone
  }
]
```

`tone` is `"good"` only for delivered, `"bad"` for denied/failed, and
`"neutral"` otherwise.

Phase labels:

```text
outbound              OUTBOUND
awaiting_approval     AWAITING JOHN
returning_with_item   RETURNING
returning_empty       RETURNING EMPTY
delivered             DELIVERED
denied                DENIED
failed                FAILED
no mission            READY
```

Trim every card string to VoiceOS caps before returning it. Never place a fact
only in the card; the model narrates from JSON.

`dispatch_errand` returns no glance card before terminal state, except at the
explicit 90-second monitor deadline. Terminal delivery uses semantic
`tone: "good"`; denial and failure use `tone: "bad"` and must never look
successful. VoiceOS owns the actual hues. A deadline card uses
`tone: "neutral"` and says monitoring ended, not that the mission did.

## Fixture and verification contract

The VoiceOS work must finish before Convex is available.

Keep orchestration testable with two pure seams:

- `monitorMission({ missionId, initialSnapshot, fetchStatus, now, sleep,
  deadlineMs })` owns exact-ID polling and returns the final
  `VoiceOSToolResult`.
- `cardForSnapshot(snapshot, monitorOutcome)` owns the three glance blocks.

Production injects real fetch/monotonic clock/sleep and `deadlineMs: 90000`.
Unit tests inject fake sequences and a tiny deadline; do not wait 90 real
seconds.

- Add `server.ts --fixture` to swap only the backend adapter.
- Make `verify.ts` launch the MCP server with `--fixture`.
- Do not use live Convex during automated verification.
- Fixture dispatch returns one mission ID exactly once.
- Successive exact-ID status calls advance a short deterministic sequence:
  `outbound → awaiting_approval → returning_with_item → delivered`.
- Every fixture status request must contain the ID returned by dispatch; an
  unknown ID returns `MISSION_NOT_FOUND`.
- Fixture `mission_status` without an ID returns the most recent delivered
  snapshot so the synchronous fallback card is exercised.

Preview file:

```json
{
  "schemaVersion": 1,
  "tools": {
    "dispatch_errand": {
      "args": {
        "item": "USB-C charger",
        "fromPerson": "John"
      },
      "expectedGlanceBlocks": 3
    },
    "mission_status": {
      "args": {},
      "expectedGlanceBlocks": 3
    }
  }
}
```

Verify:

- Manifest and MCP tool names match exactly.
- Dispatch has a confirmation, `execution.mode: "background"`, and a positive
  `estimatedDurationMs`; status has no confirmation and stays synchronous.
- Manifest includes `background`, `notify`, and the exact-domain `network`
  permissions, with no `webhook` permission.
- Required argument names match manifest and handler.
- Both tools return parseable text JSON and three glance blocks.
- Dispatch POST occurs exactly once per invocation.
- Every monitor GET uses the exact returned mission ID.
- Polling stops on each terminal state and produces exactly one final result.
- Delivered, denied, failed, and deadline outcomes have honest distinct cards.
- Pure monitor tests inject delivered, denied, failed, retryable-error, fatal
  error, unknown-ID, and shortened-deadline sequences.
- Glance payload stays below 32,000 characters.
- A sentinel requester token never appears in output.
- Missing dispatch args are rejected.
- No placeholder Convex domain remains in the final manifest.

The verifier bypasses VoiceOS confirmation and cannot prove host task tracking,
the completion sound, or automatic notch behavior. In installed VoiceOS,
manually verify that declining confirmation performs no HTTP request, approval
shows tracked background work promptly, and the final card becomes visibly open
in the side notch without a click or second utterance. That visible automatic
card is a primary pass criterion. Record whether the current host/settings also
play the completion chime; sound is optional and is never faked in integration
code.

## Live integration handoff

Person 1 supplies:

```text
CONTRACT_VERSION=2
RUNNER_API_URL=https://<deployment>.convex.site
VOICEOS_ALLOWED_DOMAIN=<deployment>.convex.site
RUNNER_REQUESTER_TOKEN=<secret>
```

Integration steps:

1. Pull Person 1's shared contract package if useful; the runtime boundary
   remains the versioned HTTP API.
2. Configure VoiceOS setup fields with URL/token.
3. Replace the manifest network hostname with the exact allowed domain.
4. Reload or reinstall the integration and approve changed permissions.
5. Confirm the per-tool **Asks first** toggle is enabled for `dispatch_errand`.
6. Reset through Person 1's command.
7. Run one live background dispatch through automatic completion.
8. Run `mission_status` once while waiting and once after completion.

## Person 2 tests worth the time

- `bun verify.ts` passes in fixture mode.
- Acting/read-only confirmation rules are correct.
- Manifest background execution and all three permissions are correct.
- Canceling confirmation causes zero backend requests.
- Dispatch happens once and every monitor request uses its returned mission ID.
- No completion result is returned before terminal state or the explicit
  monitor deadline.
- Delivered, denied, failed, and deadline cards tell the truth.
- API error envelopes become short actionable tool errors.
- Transient five-second fetch timeouts retry only inside the 90-second deadline.
- Secrets never appear in result JSON or cards.
- Live manifest contains the exact `.convex.site` network domain.

## Demo responsibilities

You own the VoiceOS side of the 75-second demo:

- Ensure VoiceOS is reloaded, configured, and showing **Asks first**.
- Confirm with Person 3 that the dashboard says `CONVEX LIVE` before speaking.
- Use the exact practiced dispatch phrase.
- Wait silently for VoiceOS to visibly open the delivered card automatically.
- Ask the final status question only if it is not visibly open by second 63.
- Do not touch Person 3's dashboard once the judged run starts.

## Person 2 completion checklist

- [ ] Bun and VoiceOS folder routing proven by minute 30; background completion
      passes or degraded mode is explicitly recorded.
- [ ] Two-tool VoiceOS verifier passes in fixture mode.
- [ ] Dispatch confirmation binds item and person.
- [ ] Installed `dispatch_errand` has **Asks first** enabled.
- [ ] Primary mode: dispatch is background, status is synchronous, required
      permissions are present, and exact-mission monitoring reaches one card;
      or degraded mode: confirmed synchronous dispatch plus status passes.
- [ ] Status has no confirmation.
- [ ] Live `.convex.site` HTTP adapter works.
- [ ] By 3:30, the exact primary spoken path opens the automatic card, or the
      explicitly activated degraded spoken dispatch/status path succeeds.
- [ ] Temporary Coffee probe is disabled/uninstalled before rehearsal.
- [ ] Nested integration scripts are handed to Person 1.
- [ ] Three rehearsals and backup recording complete.
- [ ] No Person 1 or Person 3 files or root lockfile were edited.
