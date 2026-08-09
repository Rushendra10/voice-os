# Person 1 — Convex World Engine and John's Consent Terminal

You own RUNNER's authoritative state and recipient surface. Your frozen DTOs
must let Person 2 build VoiceOS and Person 3 build the projected dashboard
without knowing database details.

Read first:

1. `global-plan.md`, especially **Frozen contract v2**.
2. `docs/SPEC.md`.
3. `docs/EVALS.md`.

Do not expand the product. Your job is to make one deterministic mission
impossible to corrupt and easy to reset.

## Your exclusive files

```text
package.json
bun.lock
convex.json
.env.example
convex/**
packages/contracts/**
apps/john-terminal/**
scripts/reset-demo.ts
```

Do not edit:

```text
apps/dashboard/**
integrations/runner/**
coffee-tracker/**
```

Person 2 owns `integrations/runner/**` and `coffee-tracker/**`; Person 3 owns
`apps/dashboard/**`. You own root dependency and lockfile reconciliation during
integration.

## Your deliverable

By the 2:30 checkpoint, this keyboard/API-driven flow must work without
VoiceOS:

```text
reset
  -> dispatch
  -> scheduled outbound movement
  -> awaiting approval
  -> John terminal receives request
  -> Y or N
  -> scheduled return
  -> delivered or denied
```

Every visible state must come from `api.world.snapshot`. No client may advance
the courier.

## Minute-by-minute plan

### 0:00–0:30 — Kill-risk proof

- Create or connect a Convex development deployment.
- Make a trivial query and mutation succeed.
- On John's actual computer, connect a minimal Convex client and prove one
  subscription update arrives.
- Ensure both computers have a working JS runtime; Bun is preferred.
- Set private Convex environment values:
  - `RUNNER_REQUESTER_TOKEN`
  - `JOHN_ACTOR_TOKEN`
  - `RUNNER_RESET_TOKEN`
- Never commit token values.

If John's machine cannot subscribe at minute 30, declare the fallback:
teammate-operated tmux on the primary machine. Continue building the same CLI.

### 0:30–0:50 — Freeze contract and schema

- Implement the exact DTOs from `global-plan.md` in
  `packages/contracts/src/index.ts`.
- Create the minimal schema below.
- Add fixed people, courier, office, and route constants in code.
- Commit the contract immediately so its names do not drift.

### 0:50–1:15 — Reset, dispatch, snapshot

- Implement deterministic reset and seed.
- Implement idempotent dispatch.
- Implement the complete `WorldSnapshot` projection.
- Implement exact-mission projection for the mission-scoped VoiceOS status
  endpoint.
- Add the first scheduled movement tick.

### 1:15–1:30 — Outbound movement and endpoint handoff

- Complete the version-guarded movement loop.
- Stop at John exactly once.
- Create the pending approval and corresponding events.
- Publish the development deployment. Send Person 2 the authenticated HTTP
  handoff and Person 3 the read-only Convex URL/contract handoff.
- Prove both status modes: omitted `missionId` and the exact dispatched ID.
- Run the 1:30 checkpoint: reset → dispatch → `awaiting_approval`.

### 1:30–2:10 — Consent and return

- Implement `approved` and `denied` transitions.
- Make the custody/state/event/scheduler change atomic.
- Return along the same fixed path.
- Complete delivery or denial at route index zero.
- Protect duplicate and contradictory decisions.

### 2:10–2:30 — John's CLI and deployment handoff

- Subscribe to John's pending approval.
- Render the 80-column-safe consent prompt.
- Bind `Y` and `N` to the real approval mutation.
- Prove the full flow once via API/keyboard.

### 2:30–3:30 — Integration support

- Person 2 connects VoiceOS; Person 3 connects the dashboard.
- Receive both teammates' nested package commands and wire the root `dev`, `john`,
  `typecheck`, `test`, `lint`, `build`, and `verify:voiceos` scripts without
  moving their dependencies to the root unnecessarily.
- Fix contract violations only; do not add features.
- Verify tokens work from the VoiceOS-installed process.
- Verify John's actual computer again.
- Add duplicate-key and denial checks.

### 3:30–4:10 — Reliability

- Make reset one command.
- Test a stale tick and duplicate `Y`.
- Shorten event messages for the projector.
- Verify `movementIntervalMs` is 450 ms for the judged route; do not retime the
  choreography after the vertical-slice gate.

### 4:10–5:00 — Feature freeze and rehearsals

- No new backend features after 4:10.
- Keep logs open during three consecutive rehearsals.
- Fix only observed failures.
- Reset immediately before each run and before the judged demo.

## Minimal Convex model

Do not create generalized people, courier, or map tables. These are fixed code
constants for the MVP:

```text
Rushendra   slug=rushendra     desk={x:1,y:7}
John        slug=john          desk={x:17,y:3}
RUNNER-01   slug=runner-01     idle at Rushendra's desk
Charger     slug=usb-c-charger initially held by John
Office      19×11 with exact walls from global-plan.md
Route       exact 21-point/20-step Point[] from global-plan.md
```

### `missions`

```ts
{
  clientRequestId: string;
  status: MissionStatus;
  requesterSlug: "rushendra";
  targetSlug: "john";
  itemSlug: "usb-c-charger";
  direction: "outbound" | "returning" | null;
  path: Point[];
  routeIndex: number;
  version: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}
```

Indexes:

- `by_client_request_id`
- An index that makes finding a nonterminal/recent mission simple.

### `items`

```ts
{
  slug: "usb-c-charger";
  name: "USB-C charger";
  holderKind: "person" | "courier";
  holderSlug: "john" | "runner-01" | "rushendra";
}
```

Index: `by_slug`.

### `approvals`

```ts
{
  missionId: Id<"missions">;
  status: "pending" | "approved" | "denied";
  approverSlug: "john";
  requestedAt: number;
  decidedAt?: number;
}
```

Index: `by_mission_id`.

### `events`

```ts
{
  missionId: Id<"missions">;
  sequence: number;
  type: EventType;
  message: string;
  createdAt: number;
}
```

Index: `by_mission_id_and_sequence`.

Keep only transition events; do not insert an event for every tile movement.

## Required functions

Implement exactly the public/internal functions in `global-plan.md`:

```text
api.world.snapshot
api.approvals.pendingForActor
api.approvals.decide
api.demo.reset
internal.missions.dispatch
internal.movement.tick
internal.world.snapshotForMission
```

Also expose:

```text
POST /api/v1/voiceos/dispatch
GET  /api/v1/voiceos/status?missionId=<optional-opaque-mission-id>
POST /api/v1/demo/reset
```

The VoiceOS HTTP action URL uses `.convex.site`; the realtime client URL uses
`.convex.cloud`.

## Transition algorithm

### Reset

1. Validate `RUNNER_RESET_TOKEN`.
2. Delete demo missions, approvals, events, and items.
3. Insert one charger held by John.
4. Return an idle `WorldSnapshot`.

Reset must be safe to run repeatedly.

### Dispatch

1. Validate exact requester, target, and item slugs.
2. If `clientRequestId` already exists, return that mission's snapshot.
3. Reject if another mission is nonterminal.
4. Reject unless John currently holds the charger.
5. Insert `outbound` mission at route index zero, version zero.
6. Append `mission_dispatched`.
7. Atomically schedule `movement.tick` with the current version.
8. Return the snapshot.

### Movement tick

1. Load the mission.
2. Return without scheduling if it is missing, terminal, not moving, or its
   version differs from `expectedVersion`.
3. Outbound: increment `routeIndex`; returning: decrement it.
4. Increment version and update time.
5. If still between desks, schedule the next tick using the new version.
6. At John's final index:
   - set `awaiting_approval` and direction `null`;
   - create one pending approval;
   - append `arrived_at_target` and `approval_requested`;
   - schedule nothing.
7. At Rushendra's zero index:
   - with item: transfer item to Rushendra and set `delivered`;
   - empty: set `denied` and leave item with John;
   - append `item_delivered` or `mission_denied` and schedule nothing.

### Approval decision

1. Validate `JOHN_ACTOR_TOKEN`.
2. Load mission and approval.
3. If the same decision was already committed, return the current snapshot with
   `replayed: true`.
4. If the opposite decision was committed, throw
   `APPROVAL_ALREADY_RESOLVED`.
5. Require `awaiting_approval`.
6. Approved:
   - approval → `approved`;
   - item holder → RUNNER-01;
   - mission → `returning_with_item`;
   - courier cargo appears from item state.
7. Denied:
   - approval → `denied`;
   - leave item with John;
   - mission → `returning_empty`.
8. Increment mission version, append the decision and return events, and
   schedule the first return tick atomically.

## Snapshot projection

`api.world.snapshot` is the single presentation contract. It must:

- Return the active mission or most recently completed mission.
- Derive courier position from `mission.path[mission.routeIndex]`.
- Return the courier idle at Rushendra when no mission exists.
- Compute progress as 0–50 outbound, 50 waiting, and 50–100 returning.
- Compute a short honest `locationLabel`.
- Estimate `etaSeconds` from remaining path cells and movement interval; return
  `null` while waiting for John.
- Return at most the latest 12 events in ascending order.
- Never return actor tokens, reset tokens, environment values, or raw errors.

`internal.world.snapshotForMission` reuses the same projection but selects the
specified mission only when its ID matches the retained active/most-recent
mission. It returns `null` when the ID is malformed, unknown, or no longer
retained. Do not substitute a newer mission and do not create a second DTO.

## HTTP contract rules

- Require `Authorization: Bearer <RUNNER_REQUESTER_TOKEN>` on dispatch and
  status. Require `Authorization: Bearer <RUNNER_RESET_TOKEN>` on reset.
- Authenticate dispatch in the HTTP action before calling
  `internal.missions.dispatch`; do not expose an unauthenticated public
  dispatch mutation.
- Parse `contractVersion` on POST bodies; reject anything other than `2`. The
  status GET is versioned by its `/api/v1/` path and returns a v2 snapshot.
- Return the exact `SuccessEnvelope` or `ErrorEnvelope` in `global-plan.md`.
- Use stable error codes, short user-safe messages, and correct status codes.
- Map invalid requester/reset bearer tokens to `401 UNAUTHORIZED`; keep
  `INVALID_ACTOR_TOKEN` for John's Convex approval functions.
- Do not leak stack traces.
- Set JSON content type.
- Set `Cache-Control: no-store` on dispatch, status, and reset responses.
- Add only the CORS behavior actually needed; the local MCP server is not a
  browser.
- For `GET /api/v1/voiceos/status?missionId=<id>`, validate and return that
  exact mission. Never silently substitute the active or latest mission.
- For status without `missionId`, return the active or most recent mission for
  the synchronous `mission_status` recovery tool.
- Return `404 MISSION_NOT_FOUND` for a supplied malformed, unknown, or
  no-longer-retained mission ID.
- Return immediately; the long-lived monitor belongs to Person 2's MCP handler,
  not this HTTP action.

## John's terminal

The terminal is a consent surface, not a general dashboard.

Idle:

```text
┌─ JOHN // RUNNER CONSENT ──────────────────────────────────────┐
│ LINKED TO CONVEX · WAITING FOR REQUEST                         │
└────────────────────────────────────────────────────────────────┘
```

Pending:

```text
┌─ INCOMING HANDOFF REQUEST ─────────────────────────────────────┐
│ REQUESTER   Rushendra                                          │
│ ITEM        USB-C charger                                      │
│ COURIER     RUNNER-01 is at your desk                          │
│                                                                │
│ [Y] APPROVE HANDOFF                 [N] DECLINE                 │
└────────────────────────────────────────────────────────────────┘
```

After `Y`:

```text
CONSENT RECORDED · CUSTODY TRANSFERRED TO RUNNER-01
```

Requirements:

- Subscribe with the Convex client; no manual refresh.
- Redraw cleanly rather than printing endless duplicate cards.
- A terminal bell on first arrival is optional and cheap.
- Ignore unrelated keys.
- Disable decision keys while a request is in flight.
- Show sanitized backend errors without exiting.
- Keep output readable at 80 columns.

## Backend tests worth the time

Must test:

- Reset produces charger held by John and no active mission.
- Frozen route has 21 valid points, correct desk endpoints, and no wall cells.
- Dispatch is idempotent by `clientRequestId`.
- Busy courier is rejected.
- Outbound ticks stop at approval.
- Stale tick is a no-op.
- Approval transfers custody once and returns.
- Duplicate same decision reports replayed.
- Contradictory decision is rejected.
- Denial returns empty and keeps charger with John.
- Delivery ends with charger held by Rushendra.
- Snapshot never includes a sentinel secret.
- Mission-scoped status returns the requested retained mission and never
  substitutes active/latest state for a mismatched ID.
- A malformed, unknown, or no-longer-retained mission ID returns
  `404 MISSION_NOT_FOUND`.
- Status responses set `Cache-Control: no-store`.

Do not spend the hackathon building exhaustive infrastructure tests.

## Handoffs to Persons 2 and 3

Send Person 2 this private VoiceOS handoff by the 1:30 checkpoint:

```text
CONTRACT_VERSION=2
RUNNER_API_URL=https://<deployment>.convex.site
VOICEOS_ALLOWED_DOMAIN=<deployment>.convex.site
RUNNER_REQUESTER_TOKEN=<secret>

Smoke tests:
reset=<pass/fail>
dispatch=<pass/fail>
snapshot reaches awaiting_approval=<pass/fail>
status by exact missionId=<pass/fail>
```

Send Person 3 only this read-only dashboard handoff:

```text
CONTRACT_VERSION=2
VITE_CONVEX_URL=https://<deployment>.convex.cloud

Smoke tests:
snapshot reaches awaiting_approval=<pass/fail>
snapshot contract matches v2=<pass/fail>
```

Give Person 2 one example HTTP success and one `COURIER_BUSY` envelope. Give
Person 3 one example live `WorldSnapshot`. Person 3 receives no bearer token.
Do not send John's or reset token unless the recipient truly needs it.

## Demo responsibilities

- Run the deterministic reset immediately before each rehearsal/demo.
- Keep Convex logs available but off the projected display.
- Operate John's real terminal or hand that single role to the designated John.
- Press `Y` only at the rehearsed consent cue; do not manually advance any other
  state.
- Confirm Person 3 has `CONVEX LIVE` and Person 2 has the final installed
  integration before the spoken request begins.
- If something fails, diagnose from Convex truth; never patch state manually on
  stage.

## Person 1 completion checklist

- [ ] Cross-computer Convex subscription proven by minute 30.
- [ ] Contract v2 implemented exactly.
- [ ] Reset is deterministic and repeatable.
- [ ] Dispatch is idempotent.
- [ ] Scheduled movement is version guarded.
- [ ] Courier stops for real consent.
- [ ] Approval/custody/phase/event/schedule commit atomically.
- [ ] Denial works honestly.
- [ ] John's terminal handles `Y/N` and duplicate keys.
- [ ] Separate `.convex.site` VoiceOS and `.convex.cloud` dashboard handoffs sent.
- [ ] Exact-mission status and `MISSION_NOT_FOUND` behavior proven.
- [ ] Root dev/build/typecheck/test/lint/VoiceOS scripts invoke both teammates'
      nested packages after merge.
- [ ] Keyboard/API flow completes by 2:30.
- [ ] No secrets appear in snapshots or logs.
- [ ] No Person 2 or Person 3 files were edited.
