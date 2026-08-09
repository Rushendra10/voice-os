# RUNNER Product Specification

## Project overview

RUNNER is a voice-controlled office-agent network presented as a retro digital
twin. A requester speaks an errand to VoiceOS, a simulated courier travels
through an office map, the recipient reviews the request from a second terminal,
and the courier returns only after the recipient approves the handoff.

The hackathon demo proves a broader product idea: personal agents can coordinate
work across people while preserving explicit human consent and a durable audit
trail.

Demo tagline: **Your voice dispatches an agent. Agents negotiate. Work moves.**

## Target users

- Primary demo user: a knowledge worker who needs an item from a coworker
  without interrupting their current task.
- Secondary user: the coworker who owns the requested item and must explicitly
  approve or decline the handoff.
- Future users: office coordinators, clinics, hotels, warehouses, and facilities
  teams coordinating people, inventory, and autonomous couriers.

## Problem statement

Delegating a physical or interpersonal errand currently requires interrupting
work, finding the right person, negotiating permission, and tracking the result.
Voice assistants can express the intent, but they rarely model the multi-party
state and consent required to complete it safely.

RUNNER turns one spoken request into an observable, durable mission with clear
ownership and approval boundaries.

## Demo narrative

The three-person build team produces a demo with two active product roles
(Rushendra and John), two computers, and three visible surfaces: the projected
browser dashboard, the real VoiceOS notch, and John's terminal.

1. Rushendra says, "Runner, get a USB-C charger from John."
2. VoiceOS presents a confirmation card identifying the item and target.
3. Rushendra approves by voice.
4. VoiceOS starts `dispatch_errand` as a tracked background task, and RUNNER
   creates a mission in Convex.
5. A courier moves tile by tile from Rushendra's desk to John's desk.
6. John's terminal displays the request and offers `Y` to approve or `N` to
   decline.
7. John presses `Y`.
8. Convex atomically records consent, transfers the charger from John to the
   courier, changes the mission to `returning_with_item`, and appends an audit
   event.
9. The courier returns to Rushendra carrying the charger.
10. The dashboard shows `DELIVERED`; the background MCP handler observes the
    terminal Convex state and returns its final result.
11. VoiceOS visibly opens the native `DELIVERED` card without another request
    or click. The documented host experience also includes a completion chime;
    sound is host/settings-controlled and verified manually rather than
    recreated by RUNNER. Rushendra may still ask, "Where is my charger?" as a
    fallback status check.

The requester does not touch the keyboard or mouse during the demo.

## MVP scope

### VoiceOS integration

- `dispatch_errand(item, fromPerson)`
  - Acting background tool with a VoiceOS confirmation.
  - Declares `execution.mode: "background"` with an estimated duration.
  - Creates one mission, remembers its exact `missionId`, monitors that mission,
    and returns one terminal result and glance card, or one honest nonterminal
    result at the monitor deadline.
  - VoiceOS owns task tracking and native completion presentation when the
    handler returns.
- `mission_status()`
  - Read-only tool.
  - Returns the active or most recent mission's phase, courier position, target,
    progress, and most recent event.
- Result cards include model-readable JSON and a visually matching native
  VoiceOS glance card.
- The manifest declares `background`, `notify`, and the exact Convex `network`
  permission.

### Convex backend

- Convex is the only authoritative state store.
- The authenticated `.convex.site` dispatch action is the only requester write
  path; it calls an internal dispatch mutation after validating the requester
  token.
- Reactive queries drive the office map, event stream, and John's terminal.
- A scheduled internal mutation advances the courier one route step at a time.
- Movement scheduling is atomic with each committed step.
- John's approval or denial is validated against current mission and inventory
  state.
- Item transfer, approval resolution, mission transition, and audit event are
  committed atomically.
- Stale or duplicate scheduled ticks and approval submissions are idempotent.

### Projected dashboard

- A separate React browser application shown fullscreen on the primary Mac's
  mirrored/projected display; it is not a VoiceOS card or tmux UI.
- `RunnerDashboard({ snapshot })` composes the screen.
- A distinct pure `RobotOfficeSimulation({ snapshot })` hero component renders
  the 19×11 office, walls/obstacles, desks, frozen route, robot, and cargo.
- Live courier position, route, mission state, item, requester, and target.
- A chronological event stream that updates without refresh.
- Strong visual phase changes:
  - cyan/blue: dispatched and outbound;
  - amber: waiting for John;
  - violet: returning with item;
  - green: delivered;
  - red: denied or failed.
- Terminal-inspired typography, restrained scanline texture, crisp box drawing,
  and animation that remains readable from across a room.
- Motion honors `prefers-reduced-motion`.
- The top-center layout reserves space for the real VoiceOS notch overlay. If
  that overlay is not reproduced on the projector, the honest fallback shows
  the dashboard on the projector and the completion card on the requester Mac.

### John's terminal

- A real CLI operated by a teammate on a second computer or terminal pane.
- Subscribes to John's pending requests through Convex.
- Clears and redraws a legible approval card when a request arrives.
- Accepts `Y`/`N` without requiring a mouse.
- Shows an unambiguous acknowledgement after the decision is committed.
- Reconnects cleanly if the terminal briefly loses network access.

### Simulation

- Fixed office grid with walls, walkable cells, Rushendra's desk, and John's
  desk.
- One courier and one charger.
- A deterministic precomputed route with 21 points/20 scheduled moves each way.
- Courier movement interval is 450 ms per tile for the judged demo; development
  fixtures may override it without changing the live choreography.
- The courier waits indefinitely at John until approval or denial.
- The UI visualizes obstacles but does not perform pathfinding, collision
  physics, or local movement simulation.

## Explicit non-goals

- Physical robot or Lightberry integration.
- General-purpose robotics simulation or physics.
- Multiple simultaneous couriers or competing missions.
- Arbitrary natural-language negotiation between autonomous LLMs.
- Canceling or recalling an in-flight mission.
- Production authentication, permissions, tenancy, or security hardening.
- Real office inventory discovery.
- Arbitrary server-initiated VoiceOS cards outside an active background tool.
- Direct Convex-to-VoiceOS inbound webhooks; VoiceOS webhook permission is
  reserved.
- Mobile support.
- Slack, email, SMS, or external messaging integrations.
- A full game engine, 3D environment, or editable map.

## Documented degraded contingency

Only if the installed minute-30 probe proves background execution unavailable
on the event's VoiceOS build, `dispatch_errand` becomes a confirmed synchronous
tool that posts once and returns the initial outbound card. The integration then
uses only exact-domain `network` permission, and the judged demo explicitly asks
`mission_status` for the final card. Convex movement, John consent, and custody
transfer remain unchanged. This is a lower-scoring recovery mode, not the MVP's
primary success definition, and it must never imitate a proactive notification.

## End-to-end user flows

### Dispatch and approve

1. VoiceOS routes the spoken request to `dispatch_errand`.
2. VoiceOS confirmation binds and displays `item` and `fromPerson`.
3. On approval, VoiceOS starts the handler as a tracked background tool and
   surfaces its background-task handle.
4. The local MCP server calls a Convex dispatch mutation and captures the
   returned `missionId`.
5. The mutation verifies that the courier is available, John exists, and John
   owns the charger.
6. It creates the mission and first audit event, assigns the courier, and
   schedules the first movement tick.
7. Reactive clients immediately render the new mission while the MCP handler
   monitors that specific mission through the versioned status endpoint.
8. Each committed tick moves exactly one tile and schedules the next.
9. Arrival creates a pending approval and sets `awaiting_approval`.
10. John's approval commits the handoff transaction and resumes movement.
11. Arrival at Rushendra transfers the charger to Rushendra and completes the
    mission.
12. The handler observes the terminal state and returns model-readable JSON plus
    the final glance card; VoiceOS performs the completion notification.

### Recipient denies

1. John presses `N`.
2. Convex records the denial and leaves the charger with John.
3. The courier returns empty-handed.
4. The mission ends as `denied`, every client displays the same outcome, and
   VoiceOS visibly opens the final denied card through the background tool.

### Requester checks status

1. Rushendra asks, "Where is my charger?"
2. `mission_status` queries the active or most recent mission.
3. VoiceOS returns data for narration plus a card containing state, progress,
   location, and ETA or decision.

## Functional requirements

- All public functions validate arguments.
- A person cannot approve for another person.
- Only the current item owner can approve a handoff.
- A courier cannot have more than one active mission.
- The same item cannot be transferred twice from duplicate approvals.
- A stale movement tick must exit without changing state.
- Every state transition writes a human-readable event.
- All clients derive display state from Convex rather than local simulation
  timers.
- `RunnerDashboard` and `RobotOfficeSimulation` accept one `WorldSnapshot` and
  perform no network calls, writes, logical timers, or snapshot mutation.
- Only `LiveDashboard` queries `api.world.snapshot`; no judged dashboard control
  dispatches, approves, resets, or advances a mission.
- The robot position equals `snapshot.courier.position`, obstacles equal
  `snapshot.office.walls`, and the route remains the frozen mission path.
- The webpage never imitates VoiceOS confirmations or result cards.
- VoiceOS tool names and descriptions match the MCP server and manifest.
- `dispatch_errand` declares background execution and the manifest includes the
  required `background` permission.
- The manifest includes `notify` for completion notifications and opening the
  side notch.
- The VoiceOS integration declares only the exact Convex deployment domain as
  network permission.
- VoiceOS, not RUNNER code, creates the background task handle. The handler
  dispatches once and produces one final MCP result.
- The background monitor queries by its captured `missionId`; it must never
  switch to a newer or merely "latest" mission.
- Dispatch is posted exactly once. An unknown captured mission returns
  `MISSION_NOT_FOUND`; it is never replaced with the latest mission.
- The monitor returns within two seconds of observing `delivered`, `denied`, or
  `failed`.
- After 90 seconds in a nonterminal state, monitoring ends honestly with the
  current snapshot, `monitorOutcome: "deadline"`, and an `AWAITING
  JOHN`/current-state card; the Convex mission may continue and remains
  queryable through `mission_status`.
- `mission_status` remains synchronous and queries active/recent state without
  a mission ID.

## State machine

```text
outbound
  -> awaiting_approval
      -> returning_with_item -> delivered
      -> returning_empty -> denied

any active state
  -> failed
```

Terminal states are `delivered`, `denied`, and `failed`.

## Data model

### Fixed demo constants

- Rushendra, John, RUNNER-01, their desk locations, and the precomputed route
  live in code rather than database tables.
- This intentionally removes generalized people, fleet, and pathfinding models
  from the five-hour MVP.

### `items`

- `slug`
- `name`
- `holderKind`: `person | courier`
- `holderSlug`: `john | runner-01 | rushendra`

### `missions`

- `clientRequestId`
- `requesterSlug`, `targetSlug`, `itemSlug`
- `status`
- `direction`: `outbound | returning | null`
- `path`: fixed grid coordinates
- `routeIndex`
- `version`: monotonic guard against stale scheduled work
- `createdAt`, `updatedAt`, `completedAt?`

### `approvals`

- `missionId`, `approverSlug`
- `status`: `pending | approved | denied`
- `requestedAt`
- `decidedAt?`

### `events`

- `missionId`
- `sequence`
- `type`
- `message`
- `createdAt`

## External integrations

### VoiceOS

- Runs a local Bun MCP server over stdio.
- Collects the request and requester confirmation.
- Runs `dispatch_errand` using VoiceOS background execution.
- Calls only the versioned `.convex.site` HTTP actions, then monitors the exact
  dispatched mission until terminal state or the monitoring deadline.
- Displays the automatically returned completion card and supports explicit
  status snapshots as a fallback.

### Convex

- Database, transactional mutations, reactive queries, and durable scheduled
  movement.
- A dev deployment is sufficient for the hackathon.
- No OpenAI dependency is required for the MVP; VoiceOS already performs intent
  routing and argument filling.

## Technical constraints

- Five-hour implementation window.
- TypeScript throughout.
- Bun runtime for the VoiceOS integration and CLI.
- React plus Vite for the projected dashboard.
- DOM/CSS grid rendering only; no canvas, WebGL, game engine, or component suite.
- Convex dev deployment.
- The dashboard and John terminal require network access to Convex.
- Background completion uses the supported VoiceOS task lifecycle; Convex does
  not push directly into VoiceOS and no reserved webhook is used.
- VoiceOS documents when to use background mode but not a maximum handler
  lifetime. RUNNER's 90-second deadline is an app policy, validated as far as
  practical with an installed 25–30 second fixture.
- The MVP uses native VoiceOS glance cards; custom widgets are intentionally
  excluded from the five-hour scope.
- The demo must remain understandable with projector audio muted.

## Security and privacy

- Demo identities use fixed tokens and are not production authentication.
- Actor tokens must not be committed; use environment variables.
- Dispatch/status HTTP actions validate `RUNNER_REQUESTER_TOKEN`; reset validates
  `RUNNER_RESET_TOKEN`; John's approval functions validate `JOHN_ACTOR_TOKEN`.
- Requester dispatch is an internal mutation reached only after the HTTP action
  authenticates it.
- VoiceOS secrets and Convex credentials must not appear in tool results, cards,
  events, screenshots, or logs.
- John must always explicitly approve the item transfer.
- The simulation must never represent a denied transfer as successful.

## Edge cases and failure modes

- John declines: courier returns empty and charger remains with John.
- John does not answer: courier waits; status reports `awaiting_approval`.
- John does not answer within 90 seconds: the background handler returns an
  honest nonterminal snapshot; the mission remains visible through the
  dashboard and `mission_status`.
- Duplicate `Y`: second approval is a harmless no-op.
- Temporary status-fetch failure: the background monitor retries within its
  overall deadline only for network/timeouts or `retryable: true` envelopes and
  never fabricates completion. Authentication, validation, conflicts, and
  `MISSION_NOT_FOUND` fail immediately.
- VoiceOS exits or disables the integration during a background run: no promise
  is made that the local monitor survives; Convex remains authoritative and
  `mission_status` recovers the truth after restart.
- Convex reconnect: clients resubscribe and render the authoritative snapshot.
- Scheduled tick runs after terminal state: no-op.
- Requested item not held by John: dispatch fails before movement with an
  actionable VoiceOS error.
- Courier busy: dispatch fails clearly rather than creating a second mission.
- VoiceOS unavailable: the dashboard may observe existing state but cannot
  create a mission through a hidden fallback control during the judged demo.
- VoiceOS notch overlay is not visible on the projector: keep the dashboard
  projected and show the real completion card on the requester Mac; never draw
  a substitute card in the webpage.

## Visual direction

The visual identity is "NASA mission control meets 1980s office terminal":

- Near-black background, phosphor cyan, amber, violet, and success green.
- Monospaced display type with tabular numbers.
- Large map cells and restrained animation for projector readability.
- Courier sprite faces the direction of travel and visibly gains a charger
  payload after approval.
- Route cells illuminate ahead of the courier and dim behind it.
- John's desk pulses amber while consent is pending.
- Approval creates a short handoff animation before the return begins.
- Event messages type in quickly but never delay the underlying state.
- No gratuitous gradients, tiny telemetry, dense tables, or fake command spam.

## Unresolved decisions

- No blocking product or architecture decisions remain. `RUNNER`, the
  fullscreen projected browser, native VoiceOS cards, the pure robot component,
  and the deterministic Convex state machine are frozen for implementation.

## Deferred ideas

- Ask Sarah automatically after John declines.
- Multiple personal agents negotiating loans and return times.
- Convex Agent threads representing the full requester-recipient conversation.
- Voice-operated fleet dispatch and conflict resolution.
- Cancel or recall an in-flight mission.
- Real hardware adapter using the same mission state machine.
- Inventory discovery: "Who has a charger?"
- Recurring return reminders and lending history.
