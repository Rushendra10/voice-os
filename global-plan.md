# RUNNER — Five-Hour Three-Person Build Plan

This is the shared execution contract for the RUNNER hackathon build. Read this
file together before anyone writes product code, then work from `person1.md`,
`person2.md`, and `person3.md` independently.

Planning sources of truth:

- `docs/SPEC.md` — product and architecture specification
- `docs/EVALS.md` — acceptance and rehearsal criteria
- `global-plan.md` — frozen parallel-work contract and five-hour schedule
- `person1.md` — Convex world engine and John's terminal
- `person2.md` — VoiceOS integration and native cards
- `person3.md` — projected robot simulation and dashboard

## Product in one sentence

RUNNER is a voice-controlled office digital twin: a spoken request dispatches a
courier to a coworker, the coworker explicitly approves the handoff from a
second terminal, and Convex synchronizes movement, consent, custody, and return
in real time.

Pitch line:

> **RUNNER is the control plane for delegated physical work. Intent moves at
> the speed of voice; consent stays human.**

The MVP is not a generic robot simulator. The product insight is that personal
agents need a shared state and a human consent boundary before work or property
moves between people.

## Risk-adjusted score

| Criterion | Score | Why it earns the score |
| --- | ---: | --- |
| Creativity | 9.4/10 | Voice intent becomes a visible courier mission involving a second real human. |
| Usefulness | 8.1/10 | The charger demonstrates last-meter coordination for offices, clinics, hotels, and warehouses. |
| Demo value | 9.8/10 | VoiceOS returns an automatic completion card after the map, terminal, and custody rail converge. |
| Convex depth | 9.4/10 | Realtime subscriptions, scheduled mutations, transactions, and idempotency are essential. |
| Voice-first fit | 9.4/10 | The requester dispatches once by voice and VoiceOS surfaces the completed background result; John's keypress is consent. |
| Five-hour feasibility | 8.7/10 | Backend, VoiceOS, and projected UI now have independent owners and fixture contracts. |

**Overall trimmed score: 9.0/10.**

The current plan has an estimated 85% chance of producing the full golden path
in five hours if Convex connectivity, VoiceOS background completion, and the
projected 19×11 grid all pass their kill-risk checks in the first 30 minutes.

## Five-hour definition of done

A build is demo-ready when all of the following work from reset without manual
database edits:

1. Rushendra speaks: "Runner, borrow the USB-C charger from John and bring it
   to me."
2. VoiceOS shows a native confirmation, dispatches only after approval, and
   tracks `dispatch_errand` as background work.
3. `RobotOfficeSimulation` shows RUNNER-01 moving tile by tile among fixed office
   obstacles using only Convex state.
4. John's real terminal receives a `Y/N` consent request.
5. John's `Y` atomically resolves consent, transfers charger custody to the
   courier, writes an event, and starts the return.
6. The courier visibly carries the charger back.
7. Delivery atomically transfers custody to Rushendra and turns the scene green.
8. The in-flight RUNNER handler observes the terminal mission and returns the
   final glance result; VoiceOS visibly opens `Delivered · With Rushendra`
   without a click or second requester command.
9. `mission_status` returns the same truth when explicitly asked as a fallback.
10. A reset command restores the exact initial state.
11. The entire flow succeeds three consecutive times.

## Ruthless scope

### Must ship for the full-score path

- One requester: Rushendra.
- One recipient: John.
- One courier: RUNNER-01.
- One item: USB-C charger.
- One fixed office and a 21-point/20-step precomputed route.
- Separate pure `RobotOfficeSimulation` component with visible walls/obstacles,
  desks, route, courier, and cargo.
- Background VoiceOS `dispatch_errand` plus synchronous `mission_status`.
- Native VoiceOS confirmation and result cards.
- `background`, `notify`, and exact Convex `network` permissions.
- Exact-mission monitoring through the active MCP invocation; no webhook.
- Convex-driven movement; no client advances the courier.
- Real second-person `Y/N` approval.
- Atomic consent and custody transfer.
- Realtime projected map, custody rail, and concise event stream.
- Approve, deny, duplicate-key protection, and deterministic reset.

### Explicitly cut

- `cancel_mission`.
- BFS or other pathfinding.
- Multiple people, items, couriers, or concurrent missions.
- LLM negotiation or Convex Agent components.
- Custom VoiceOS HTML widgets.
- Production authentication or tenancy.
- Physical robot integration.
- Automatic rerouting after denial.
- General inventory search.
- Audio design, 3D, canvas engines, and editable maps.

Do not revive a cut feature before the golden path passes three consecutive
times.

## Parallel ownership

### Person 1 — World engine and consent

Owns the authoritative system and recipient surface:

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

Deliverables:

- Convex schema and fixed office constants.
- Reset, dispatch, snapshot, approval, denial, and scheduled movement.
- Version/idempotency guards.
- Versioned VoiceOS HTTP endpoints.
- John's reactive CLI.
- Backend tests and live deployment handoff.

### Person 2 — VoiceOS control plane

Owns the installed VoiceOS integration:

```text
integrations/runner/**
coffee-tracker/**   # temporary spike/template only; final code moves out
```

Person 2 may copy/adapt mechanics from `coffee-tracker/**` into the separately
installed `integrations/runner/**`. Do not change the installed probe's immutable
ID in place; disable/uninstall it before rehearsal. Persons 1 and 3 must not
touch those paths.

Deliverables:

- VoiceOS tools, manifest, confirmations, result cards, and verifier fixtures.
- Background completion polling and the automatic terminal-result card.
- Installed-host testing, degraded fallback, and spoken demo recovery.

### Person 3 — Projected robot simulation

Owns the visual digital twin shown to the judges:

```text
apps/dashboard/**
```

Persons 1 and 2 must not touch that path.

Deliverables:

- Fixture-first `RunnerDashboard` shell.
- Pure `RobotOfficeSimulation` component for the 19×11 office, obstacles,
  desks, route, courier, and visible cargo.
- Live Convex subscription after Person 1's handoff.
- Mission panel, custody rail, event rail, phase colors, and delivery moment.
- Fullscreen projector layout, reduced-motion behavior, and visual rehearsal.

### Shared-file rule

- Person 1 owns root package/lock reconciliation.
- Persons 2 and 3 use package files within their owned directories and do not
  change the root lockfile.
- Persons 2 and 3 hand over their nested package script names; Person 1 wires
  the root `dev`, `john`, `typecheck`, `test`, `lint`, `build`, and
  `verify:voiceos` scripts after the merge.
- Nobody edits `global-plan.md`, `person1.md`, `person2.md`, `person3.md`,
  `docs/SPEC.md`, or `docs/EVALS.md` during the parallel build unless all three
  agree.
- Contract names freeze after minute 30. Any change must be stated explicitly
  and acknowledged by all three people before code changes.

## System shape

```text
Voice command
    │
    ▼
VoiceOS confirmation
    │
    ▼
background dispatch_errand invocation
    │ POST dispatch once
    ├──────────────────────► Convex transactional state machine
    │                                  │
    │ GET status?missionId=...         ├────────► Projected browser
    │ until terminal                   │          RunnerDashboard
    │                                  │               │
    │                                  │               └─ RobotOfficeSimulation
    │                                  └────────► John's terminal
    │                                             reactive subscription
    │                                                     │ Y/N
    │◄────────────────── final mission snapshot ───────────┘
    │
    ▼
final model JSON + native glance card
    │
    ▼
VoiceOS background completion UI
```

Convex is the only authoritative source. The dashboard and terminal never move
the courier locally; they render subscribed state. Convex does not directly
push a card into VoiceOS. The still-active background MCP invocation observes
Convex and returns one final result; VoiceOS owns task tracking and completion
presentation.

## Frozen contract v2

Version 2 is the pre-build revision that adds mission-scoped status lookup and
the VoiceOS background-result payload. It supersedes the earlier planning-only
v1; nobody should implement v1.

Person 1 implements these types in `packages/contracts/src/index.ts`. Persons 2
and 3 may copy this exact shape into fixtures until Person 1's contract package
is available. No tokens or secrets may appear in any returned DTO.

```ts
export const CONTRACT_VERSION = 2 as const;

export type MissionStatus =
  | "outbound"
  | "awaiting_approval"
  | "returning_with_item"
  | "returning_empty"
  | "delivered"
  | "denied"
  | "failed";

export type Point = { x: number; y: number };
export type PersonRef = { slug: string; displayName: string };
export type ItemRef = { slug: string; name: string };
export type HolderRef = {
  kind: "person" | "courier";
  slug: string;
  displayName: string;
};

export type EventType =
  | "mission_dispatched"
  | "arrived_at_target"
  | "approval_requested"
  | "handoff_approved"
  | "handoff_denied"
  | "return_started"
  | "item_delivered"
  | "mission_denied"
  | "mission_failed";

export type EventView = {
  sequence: number;
  type: EventType;
  message: string;
  createdAt: number;
};

export type MissionView = {
  id: string;
  status: MissionStatus;
  requester: PersonRef;
  target: PersonRef;
  item: ItemRef;
  direction: "outbound" | "returning" | null;
  path: Point[];
  routeIndex: number;
  progressPercent: number;
  locationLabel: string;
  etaSeconds: number | null;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

export type ApprovalView = {
  missionId: string;
  status: "pending" | "approved" | "denied";
  approver: PersonRef;
  requestedAt: number;
  decidedAt?: number;
};

export type WorldSnapshot = {
  contractVersion: 2;
  serverNow: number;
  movementIntervalMs: number;
  office: {
    width: number;
    height: number;
    walls: Point[];
    desks: Array<Point & { person: PersonRef }>;
  };
  courier: {
    slug: "runner-01";
    displayName: "RUNNER-01";
    position: Point;
    status: "idle" | "outbound" | "waiting" | "returning";
    carrying: ItemRef | null;
  };
  item: ItemRef & { holder: HolderRef };
  mission: MissionView | null;
  approval: ApprovalView | null;
  events: EventView[]; // ascending sequence; latest 12 maximum
};

export type SuccessEnvelope = {
  ok: true;
  snapshot: WorldSnapshot;
};

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "UNKNOWN_REQUESTER"
  | "UNKNOWN_TARGET"
  | "UNKNOWN_ITEM"
  | "ITEM_NOT_HELD_BY_TARGET"
  | "COURIER_BUSY"
  | "NOT_AWAITING_APPROVAL"
  | "INVALID_ACTOR_TOKEN"
  | "APPROVAL_ALREADY_RESOLVED"
  | "MISSION_NOT_FOUND"
  | "SERVICE_UNAVAILABLE";

export type ErrorEnvelope = {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type VoiceOSToolResult = {
  contractVersion: 2;
  tool: "dispatch_errand" | "mission_status";
  monitorOutcome: "terminal" | "deadline" | "not_applicable";
  snapshot: WorldSnapshot;
};
```

`VoiceOSToolResult` is the model-readable data payload. Person 2 merges the
native card alongside it under `_voiceos_glance` at the MCP wire boundary;
`_voiceos_glance` is deliberately not part of this shared DTO and VoiceOS strips
it before the model reads the result.

### Fixed canonical identities

```text
requesterSlug = rushendra
targetSlug    = john
itemSlug      = usb-c-charger
courierSlug   = runner-01
```

### Fixed office geometry

All fixtures and live Convex use these exact coordinates so the three people can
build independently without a map merge:

```ts
export const OFFICE_WIDTH = 19;
export const OFFICE_HEIGHT = 11;

export const RUSHENDRA_DESK: Point = { x: 1, y: 7 };
export const JOHN_DESK: Point = { x: 17, y: 3 };

export const WALLS: Point[] = [
  { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
  { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 },
  { x: 13, y: 6 }, { x: 15, y: 8 }, { x: 16, y: 8 }
];

export const ROUTE: Point[] = [
  { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
  { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 },
  { x: 7, y: 7 }, { x: 7, y: 6 }, { x: 7, y: 5 },
  { x: 7, y: 4 }, { x: 7, y: 3 }, { x: 8, y: 3 },
  { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 11, y: 3 },
  { x: 12, y: 3 }, { x: 13, y: 3 }, { x: 14, y: 3 },
  { x: 15, y: 3 }, { x: 16, y: 3 }, { x: 17, y: 3 }
];
```

The route has 21 points and therefore 20 moves each way. No route point appears
in `WALLS`.

### Projected UI component contract

The robot simulation is a separate browser component owned by Person 3. It is
shown fullscreen on the primary Mac's mirrored/projected display; it is not a
VoiceOS card and it is not rendered in tmux. VoiceOS remains in the Mac notch,
and John's consent CLI remains on the second computer or tmux fallback.

```text
RunnerDashboard({ snapshot })
├── RobotOfficeSimulation({ snapshot })
│   ├── 19×11 office grid
│   ├── walls/obstacles and two desks
│   ├── authoritative route and courier position
│   └── charger attached to desk/courier/requester by custody
├── MissionPanel({ snapshot })
├── CustodyRail({ snapshot })
└── EventRail({ events })
```

Frozen component boundary:

```ts
export type RobotOfficeSimulationProps = {
  snapshot: WorldSnapshot;
};
```

`RobotOfficeSimulation` is pure: it never calls Convex, owns a mission timer,
advances `routeIndex`, invents intermediate state, or mutates the snapshot. It
may use CSS transitions between successive authoritative positions. Obstacles
are visualized from `snapshot.office.walls`; routing remains the frozen
precomputed path, so Person 3 does not implement pathfinding or collision
simulation.

The VoiceOS adapter accepts natural display strings and canonicalizes
case-insensitively. For this MVP, unsupported people/items return an honest
actionable error rather than being invented.

### Convex public functions

```ts
api.world.snapshot({}) -> WorldSnapshot

api.approvals.pendingForActor({
  actorToken: string
}) -> {
  missionId: string;
  requester: PersonRef;
  item: ItemRef;
  requestedAt: number;
} | null

api.approvals.decide({
  actorToken: string;
  missionId: string;
  decision: "approved" | "denied";
}) -> {
  snapshot: WorldSnapshot;
  replayed: boolean;
}

api.demo.reset({ resetToken: string }) -> WorldSnapshot
```

Internal only:

```ts
internal.missions.dispatch({
  requesterSlug: "rushendra",
  targetSlug: "john",
  itemSlug: "usb-c-charger",
  clientRequestId: string
}) -> WorldSnapshot

internal.world.snapshotForMission({
  missionId: string
}) -> WorldSnapshot | null

internal.movement.tick({
  missionId: Id<"missions">,
  expectedVersion: number
}) -> null
```

### VoiceOS HTTP actions

These endpoints are the boundary between Persons 1 and 2. Person 3 remains
independent through the shared `WorldSnapshot` and later imports the generated
Convex API for the live dashboard.

The `/api/v1/` route prefix versions the small HTTP transport; the
`contractVersion: 2` field versions returned/shared DTOs. They are intentionally
independent.

```text
POST /api/v1/voiceos/dispatch
GET  /api/v1/voiceos/status?missionId=<opaque-mission-id>
POST /api/v1/demo/reset
Content-Type: application/json
```

Authentication is endpoint-specific:

```text
dispatch + status: Authorization: Bearer <RUNNER_REQUESTER_TOKEN>
reset:             Authorization: Bearer <RUNNER_RESET_TOKEN>
```

Dispatch request:

```json
{
  "contractVersion": 2,
  "clientRequestId": "opaque-uuid",
  "requesterSlug": "rushendra",
  "targetSlug": "john",
  "itemSlug": "usb-c-charger"
}
```

Reset request:

```json
{ "contractVersion": 2 }
```

Every success returns `SuccessEnvelope`. Every failure returns `ErrorEnvelope`
with an appropriate `400`, `401`, `404`, `409`, or `503` status. Person 2's MCP
handler uses a five-second fetch timeout and throws the sanitized `message`.

When `missionId` is present, it must match the retained active/most-recent
mission and status returns that mission. A malformed, unknown, or
no-longer-retained ID returns `404 MISSION_NOT_FOUND`; it is never silently
replaced with latest state. When omitted, status returns the active or most
recent mission for the synchronous `mission_status` tool. All three HTTP actions
set `Cache-Control: no-store`.

### VoiceOS background completion contract

`dispatch_errand` is one background MCP invocation with one final MCP result:

1. VoiceOS renders the acting confirmation before handler code runs.
2. After approval, the handler generates one `clientRequestId` and calls
   dispatch exactly once.
3. It reads `snapshot.mission.id` from the dispatch response.
4. The same handler remains unresolved and polls
   `/api/v1/voiceos/status?missionId=<id>` every 500–750 ms.
5. A monotonic 90-second monitor clock starts when the successful dispatch
   response yields the mission ID. Each GET timeout and sleep is clamped to the
   remaining time.
6. Retry only network/timeouts and error envelopes with `retryable: true`.
   Never retry `400`, `401`, `404`, `409`, or any `retryable: false` response;
   `MISSION_NOT_FOUND` fails immediately.
7. On `delivered`, `denied`, or `failed`, the handler returns a
   `VoiceOSToolResult` with `monitorOutcome: "terminal"` plus the native
   three-block glance card.
8. VoiceOS tracks the background invocation and owns the completion UI.

The handler does **not** create or return a custom task handle. It also does not
return an initial dispatch card and then a second result; the dashboard provides
immediate outbound feedback, and the MCP invocation has one final result.

Monitoring deadline: 90 seconds. If the mission is still nonterminal, return a
`VoiceOSToolResult` with `monitorOutcome: "deadline"` and an honest current-state
card such as `AWAITING JOHN`; do not cancel the Convex mission or claim
completion. `mission_status` remains the recovery path.

Manifest requirements for `dispatch_errand`:

```json
"execution": {
  "mode": "background",
  "estimatedDurationMs": 30000
}
```

Top-level permissions:

```json
"permissions": [
  { "kind": "background" },
  { "kind": "notify" },
  { "kind": "network", "domains": ["<deployment>.convex.site"] }
]
```

`background` permits the tool's background execution. `notify` grants
completion notifications and opening the side notch. Neither is a
Convex-to-VoiceOS push API; the inbound `webhook` permission is reserved and is
not used.

### Degraded VoiceOS contingency

This is activated only if the installed minute-30 spike proves that documented
background execution is unavailable on the event build of VoiceOS. It is not
the full-score definition of done:

1. Remove `execution.mode: "background"` from `dispatch_errand` and do not claim
   proactive completion.
2. Keep the acting confirmation, post dispatch once, and return the honest
   initial outbound card synchronously with `monitorOutcome: "not_applicable"`.
3. Keep `mission_status` synchronous and end the judged demo with, "Runner,
   where's my charger?"
4. Preserve Convex movement, John's real consent, custody transfer, and every
   projected wow moment.
5. Tell the VoiceOS representative what failed; do not invent a webhook, direct
   notification API, or fake automatic card.

If this contingency is activated, Person 2 records the exact host/version and
failure. All non-background acceptance checks remain mandatory.

Fallback schedule branch:

- **0:30–1:00:** Person 2 implements and verifies confirmed synchronous dispatch
  plus synchronous status; skip the background monitor and lifetime test.
- **1:00–1:30:** Person 2 hardens confirmation, error cards, and the spoken
  fallback. Person 3's visual schedule does not change.
- **3:10–3:30:** prove spoken dispatch → John approval → spoken final status.
- **Rehearsal:** use the fallback version of the 75-second script every time;
  do not alternate lifecycles on stage.

### Required environment handoff

At the 1:30 checkpoint, Person 1 sends Person 2 only the VoiceOS values:

```text
RUNNER_API_URL=https://<deployment>.convex.site
VOICEOS_ALLOWED_DOMAIN=<deployment>.convex.site
RUNNER_REQUESTER_TOKEN=<shared privately>
CONTRACT_VERSION=2
```

Person 1 separately sends Person 3 the read-only dashboard values:

```text
VITE_CONVEX_URL=https://<deployment>.convex.cloud
CONTRACT_VERSION=2
```

Person 3 does not receive the requester, John, or reset tokens. John's token and
the reset token remain with Person 1.

## State machine and invariants

```text
outbound
  -> awaiting_approval
      -> returning_with_item -> delivered
      -> returning_empty     -> denied

any nonterminal state -> failed
```

Movement uses the same precomputed path in both directions:

- The path has 21 points, so each one-way trip is exactly 20 scheduled moves.
- Outbound increments `routeIndex`.
- Return decrements `routeIndex`.
- `path[routeIndex]` must always equal `courier.position`.
- Progress is 0–50% outbound, 50% waiting, and 50–100% returning.

Required invariants:

1. A stale `expectedVersion` is a no-op and schedules nothing.
2. Only one nonterminal mission exists.
3. No client advances movement.
4. Repeating the same approval returns `replayed: true` without transferring
   the item again.
5. A contradictory second decision throws `APPROVAL_ALREADY_RESOLVED`.
6. Approval atomically resolves consent, transfers custody to RUNNER-01,
   changes the mission phase, appends events, increments version, and schedules
   the first return tick.
7. Denial atomically resolves consent without transferring custody and starts
   an empty return.
8. Delivery atomically transfers custody to Rushendra and marks the mission
   complete.
9. Every user-visible transition has one short event; movement cells do not
   spam the event rail.

## Five-hour clock

### 0:00–0:30 — Kill-risk smoke tests

Person 1:

- Create/connect the Convex dev deployment.
- Prove a minimal query and mutation from the primary computer.
- Prove John's actual computer can subscribe.

Person 2:

- Make `bun --version` pass on the VoiceOS Mac; Bun is currently absent.
- Turn one disposable scaffold tool into the smallest confirmed background
  spike: it waits about two seconds and returns a native card.
- Run its verifier, install it once with `background`/`notify`, and use one
  spoken invocation to prove routing, background tracking, and visible
  completion together.
- Verify that canceling the confirmation starts neither the handler nor a mock
  dispatch.

Person 3:

- Confirm Bun works on the dashboard machine.
- Scaffold the dashboard inside `apps/dashboard` without touching root files.
- Render the frozen 19×11 grid, walls, desks, route, and courier from one static
  `WorldSnapshot`.
- Put it fullscreen on the actual projected/mirrored display and prove it fits
  1280×720 with no scroll and readable contrast.
- With Person 2's probe, verify the real notch completion card over that layout
  or freeze the honest dashboard-projector/card-on-Mac fallback.

**Abort or simplify immediately** if either Convex cross-computer subscription
or VoiceOS folder installation is still blocked at minute 30. If the grid fails
the projector check, cut decoration and keep the office/map skeleton. If
documented background completion cannot be validated, activate the synchronous
contingency and ask a VoiceOS representative before spending more time on
undocumented workarounds.

### 0:30–1:30 — Independent foundations

Person 1:

- Contract package, schema, constants, reset, dispatch, snapshot.
- Scheduled outbound movement through `awaiting_approval`.

Person 2:

- RUNNER manifest, confirmation, setup fields, two tool definitions, and
  fixture adapter.
- Exact-mission background monitor, terminal cards, pure monitor tests, and
  verifier.
- Installed 25–30 second fixture run; then disable the temporary probe.

Person 3:

- `RunnerDashboard` and pure `RobotOfficeSimulation` tell the complete story
  from `demoSnapshot.ts`.
- Mission panel, custody rail, five-event rail, all phases, cargo, and obstacles.

**Checkpoint at 1:30:**

- Real dispatch reaches `awaiting_approval` in Convex.
- Fixture dashboard can visually play every phase.
- VoiceOS verifier and installed realistic-duration fixture pass.

### 1:30–2:30 — Human handoff

Person 1:

- Approval/denial transaction, return movement, delivery, John CLI.
- Publish deployment URLs and tokens using the handoff above.

Person 2:

- Connect the MCP HTTP adapter to Person 1's `.convex.site` actions.
- Verify exact-ID polling, delivered/denied/failed/deadline cards, permissions,
  and the synchronous status fallback.

Person 3:

- Cargo/custody animation, phase colors, event rail, responsive projector layout.
- Connect dashboard to `api.world.snapshot` once Person 1's generated API lands.

**Checkpoint at 2:30:** keyboard/API dispatch → John `Y` → return → delivery
works; the live dashboard renders it, and the VoiceOS adapter is pointed at the
real authenticated endpoints.

### 2:30–3:30 — Voice vertical slice

- Person 2 connects the MCP HTTP adapter to the live `.convex.site` endpoints.
- `dispatch_errand` captures the returned mission ID and monitors the exact
  mission until terminal state.
- Person 1 hardens duplicate decisions, reset, and John's real computer.
- Person 3 confirms every live Convex phase maps to the expected robot position,
  obstacle layout, cargo, custody, and event state.
- Run the exact spoken golden path.

**Checkpoint at 3:30:** the exact spoken phrase completes the real flow once and
VoiceOS visibly opens its terminal completion card without another requester
command.
If it does not, stop polish and fix only this path.

### 3:30–4:10 — Signature polish

Person 1 verifies denial, duplicate `Y`, reset, scheduler guards, and John's
real terminal.

Person 2 verifies confirmation cancellation, background completion, synchronous
status, permissions, and delivered/denied card truth.

Person 3 polishes the John approval flash, cargo attachment, custody rail,
violet return, green delivery sweep, reduced motion, and projector readability.

### 4:10 — Hard feature freeze

No new features, libraries, refactors, or visual systems.

### 4:10–5:00 — Rehearsal and backup

- Test projector legibility from the back of the room.
- Run reset → golden path three consecutive times.
- Record one clean backup/social video.
- Fix only failures seen during rehearsal.

## Merge and integration procedure

1. Push these planning files as the common base commit.
2. Create three workspaces/branches from that exact commit.
3. Do not modify another person's owned paths.
4. Person 1 commits the contract/backend foundation by the 1:30 checkpoint.
5. Persons 2 and 3 continue against frozen fixtures; they do not wait for that
   commit.
6. At 1:30, merge Person 1's contract foundation into Persons 2 and 3 only if
   needed; fixture work continues if the merge is noisy.
7. At 2:30, merge Person 1 first, Person 2 second, and Person 3 third. Person 1
   resolves root package/lock scripts; each other person resolves only their
   owned application path.
8. Person 2 connects the MCP adapter to `.convex.site`; Person 3 connects
   `LiveDashboard` to `.convex.cloud`.
9. All three people switch to the integration branch for the remaining clock.

No opportunistic cleanup during the merge.

## Signature wow moment

John presses `Y`. One Convex transaction causes all of the following:

1. John's terminal prints `CONSENT RECORDED`.
2. The projected office flashes `CUSTODY TRANSFERRED`.
3. The charger icon visibly detaches from John's desk and locks onto RUNNER-01.
4. The custody rail changes `JOHN → RUNNER-01`.
5. The map changes amber to violet and the route reverses.
6. The event rail adds a numbered consent receipt.

At delivery, custody changes `RUNNER-01 → RUSHENDRA` and the entire scene resolves
to green. The in-flight MCP handler then returns the terminal snapshot and
VoiceOS visibly opens the final `DELIVERED` card without another requester
command.
This compound moment is the feature to polish; everything else supports it.

On-stage ownership:

- Person 1 resets beforehand and operates John's consent terminal.
- Person 2 speaks as the requester and owns VoiceOS/recovery timing.
- Person 3 owns the projected browser/recording and goes hands-off once the
  request begins.

## Judged 75-second demo

- **0–8 sec:** "Voice assistants answer questions. RUNNER sends work across
  people—without crossing consent boundaries."
- **8–16 sec:** Say: "Runner, borrow the USB-C charger from John and bring it to
  me."
- **16–23 sec:** VoiceOS native confirmation appears; say "yes."
- **23–34 sec:** VoiceOS yields control with a tracked background-task
  indicator while RUNNER-01 completes its nominal 9-second outbound trip and
  the event rail shows intent.
- **34–43 sec:** Courier stops at John; office turns amber; John's real terminal
  asks for consent. Say: "It can travel there, but it cannot take what it does
  not own."
- **43–50 sec:** John presses `Y`.
- **50–59 sec:** The nominal 9-second return trip runs with the charger visibly
  attached while the custody-transfer moment lands.
- **59–62 sec:** Delivery transfers custody to Rushendra, the scene turns green,
  and VoiceOS visibly opens `DELIVERED · With Rushendra` without another
  command.
- **62–75 sec:** Let the shared final state breathe, point to the consent
  receipt, and close: "One voice command, two humans, one durable shared
  truth."

Do not demonstrate denial in the judged golden path; keep it ready for questions.
If the host completion card is not visibly open by second 63, immediately ask,
"Runner, where's my charger?" and finish on the synchronous status card. This
is a rehearsed recovery path, not the primary demo.

## Cut ladder when behind

Apply cuts in this order without debate:

1. Remove decorative scanlines/typewriter animation.
2. Reduce events to four fixed messages.
3. Replace animated route trail with colored visited cells.
4. Keep denial in backend but remove denial-specific visual polish.
5. Run John's terminal on the primary machine in teammate-controlled tmux if
   second-computer networking fails.
6. Replace smooth courier tweening with cell-to-cell jumps.

Never cut voice confirmation, real John approval, atomic custody transfer,
visible cargo, return movement, or reset. Keep background completion unless the
minute-30 platform spike proves it unavailable; `mission_status` is the explicit
recovery path, not a hidden fake push.

## Known risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Bun is not installed | Persons 2 and 3 prove Bun on their VoiceOS/dashboard machines within the first 30 minutes. |
| Background host behavior is not covered by MCP unit tests | Run an installed two-second background spike by minute 30; keep `mission_status` as fallback. |
| VoiceOS documents no maximum background-handler lifetime | Person 2 runs one installed 25–30 second fixture by 1:30; RUNNER's 90-second limit is an app policy, not a host guarantee. |
| Handler watches the wrong mission | Dispatch returns an ID; every poll includes that ID and tests assert it never changes. |
| Recipient never answers | Stop monitoring after 90 seconds with an honest current-state card; do not cancel Convex state. |
| Convex scheduler timing varies | Short fixed route; CSS animates between authoritative cell updates. |
| Duplicate scheduled ticks | Mission ID, active status, and monotonic version guard every tick. |
| VoiceOS-launched process misses shell env | Use VoiceOS setup fields for URL/token; test through the installed app early. |
| Exact network permission domain unknown | Person 1 hands off the `.convex.site` hostname by 1:30; no wildcard. |
| Second computer cannot connect | Test by minute 30; fallback to teammate-operated tmux on primary. |
| Acting verifier dirties live state | Fixture adapter only; live demo always begins with reset. |
| Projector layout fails late | Person 3 proves the static 19×11 grid on the actual display by minute 30. |
| VoiceOS notch is not mirrored to the projector | Test with Person 2's probe at minute 30; use the honest dashboard-on-projector/card-on-Mac fallback, never a web imitation. |
| Merge churn | Three exclusive paths, frozen DTOs, and Person 1 owns root files. |
| Visual overbuilding | Person 3 uses a DOM/CSS grid only and spends polish on custody transfer and delivery. |

## Final go/no-go gates

- **Minute 30:** Convex connectivity, VoiceOS installation/background probe,
  projected static office grid, and notch/two-surface display strategy all pass.
- **Minute 90:** Backend reaches approval; dashboard fixture tells the full
  story; primary VoiceOS verifier/lifetime fixture pass. In degraded mode, both
  synchronous tools verify and no background claim remains.
- **Minute 150:** Keyboard/API golden path completes.
- **Minute 210:** Primary mode: spoken golden path and automatic card complete.
  Degraded mode: spoken dispatch and final spoken status complete.
- **Minute 250:** Feature freeze.
- **Minute 300:** Three consecutive rehearsals and backup recording complete.
