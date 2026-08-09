# RUNNER Evaluation Plan

This document defines when the hackathon MVP is complete. Must-pass checks take
priority over visual flourishes and stretch features.

## Must-pass MVP checks

### Voice dispatch

- [ ] Saying "Runner, get a USB-C charger from John" routes to
      `dispatch_errand` with `item="USB-C charger"` and `fromPerson="John"`.
- [ ] VoiceOS displays a confirmation before creating the mission.
- [ ] The installed integration's per-tool **Asks first** toggle is enabled for
      `dispatch_errand` before rehearsal and judging.
- [ ] Declining the VoiceOS confirmation creates no Convex records.
- [ ] `dispatch_errand` is declared as a background tool and the manifest has
      `background`, `notify`, and exact Convex `network` permissions.
- [ ] Approving creates exactly one mission and one initial event while VoiceOS
      surfaces a tracked background task.
- [ ] Tracked background work appears promptly after confirmation; RUNNER does
      not fabricate or return its own task-handle schema.
- [ ] The requester uses no keyboard or mouse during the golden path.

### Reactive simulation

- [ ] `RobotOfficeSimulation` exists as a separate component beneath
      `RunnerDashboard` and accepts one `WorldSnapshot`.
- [ ] It renders the 19×11 grid, frozen obstacles, desks, route, robot, and cargo.
- [ ] A static snapshot fits the actual projected/mirrored 1280×720 display by
      minute 30, with either a visible real-notch overlay or the documented
      two-surface fallback.
- [ ] The projected dashboard displays the new mission within 750 ms of the
      committed dispatch under normal hackathon Wi-Fi.
- [ ] The courier advances one route cell per scheduled step.
- [ ] Dashboard position is derived from Convex state, not a client-only timer.
- [ ] No dashboard component dispatches, approves, resets, advances
      `routeIndex`, or fabricates a VoiceOS card.
- [ ] A page refresh reconstructs the correct courier position and mission state.
- [ ] Arrival at John transitions exactly once to `awaiting_approval`.

### John approval

- [ ] John's terminal displays requester, item, and mission when the courier
      arrives.
- [ ] `Y` approves and `N` denies without a mouse.
- [ ] Approval transfers the item, resolves consent, changes mission state, and
      appends an event atomically.
- [ ] A second approval attempt cannot duplicate the transfer.
- [ ] Another person's actor token cannot approve John's request.

### Return and completion

- [ ] After approval, the courier visibly carries the charger.
- [ ] The courier returns along a valid route.
- [ ] Arrival transfers the charger from courier to requester and marks the
      mission `delivered` atomically.
- [ ] Dashboard and John's terminal converge on the same final state.
- [ ] The background handler monitors the exact dispatched `missionId`.
- [ ] No completion result appears before a terminal Convex state, except for
      the explicit honest monitor-deadline result.
- [ ] Within two seconds of observing terminal Convex state, the background
      handler returns and VoiceOS visibly opens the matching completion card
      without a click or another utterance.
- [ ] `mission_status` returns `delivered` and identifies the new item holder.

### Denial and waiting

- [ ] Denial leaves the charger with John and returns the courier empty-handed.
- [ ] No response leaves the courier waiting without silently auto-approving.
- [ ] A monitoring deadline returns an honest nonterminal card rather than
      claiming the mission completed.
- [ ] Voice status accurately reports `awaiting_approval` while John has not
      decided.

### VoiceOS contract

- [ ] Manifest and MCP server expose the same tool names.
- [ ] Every tool has a precise model-facing routing description.
- [ ] Acting tools have confirmations; the read-only status tool does not.
- [ ] `dispatch_errand.execution.mode` is `background` and has an estimated
      duration.
- [ ] An installed 25–30 second fixture completes visibly once before live
      integration; the two-second probe is not treated as a lifetime test.
- [ ] The background handler dispatches once and returns exactly one MCP result.
- [ ] Contract version 2 and `MISSION_NOT_FOUND` behavior match the frozen
      shared contract.
- [ ] Every tool result contains model-readable JSON and a user-visible card.
- [ ] `bun verify.ts` passes from the integration folder.

## Automated tests

### Convex model tests

- Dispatch rejects unknown person, missing item, item ownership mismatch, and
  busy courier.
- Route has exactly 21 points, starts at `{1,7}`, ends at `{17,3}`, never
  crosses a wall, and never leaves the 19×11 grid.
- Movement increments `routeIndex` once.
- Stale version/tick is a no-op.
- Arrival creates one pending approval.
- Approval commits every required update together.
- Denial never transfers inventory.
- Duplicate approval is idempotent.
- Terminal mission states reject further movement.

### VoiceOS integration tests

- Preview fixture calls every declared tool.
- Fixture-backed dispatch progresses from outbound to delivered quickly enough
  to exercise background completion without live Convex.
- Pure monitor/card-mapper tests inject delivered, denied, failed, retryable
  error, fatal error, unknown-ID, and shortened-deadline sequences; they do not
  wait for the production 90-second clock.
- Dispatch serializes Convex failures into actionable MCP errors.
- Background monitoring queries status using the returned mission ID.
- Dispatch POST occurs exactly once; transient monitor retries never redispatch.
- Background monitoring stops on `delivered`, `denied`, and `failed`.
- Each terminal state maps to an honest distinct final card.
- Monitoring timeout returns the current honest state.
- Status cards stay within VoiceOS glance-block limits.
- Secrets and actor tokens are absent from returned JSON and UI payloads.

### UI tests

- `RobotOfficeSimulation` performs no fetch, Convex write, or logical timer.
- Every wall in `snapshot.office.walls` renders as an obstacle, and no route
  cell overlaps one.
- Robot position matches `snapshot.courier.position` at route start, turn, John,
  return, and delivery.
- Cargo visibility follows `snapshot.courier.carrying` exactly.
- Every mission state maps to a distinct label and accessible color treatment.
- Missing optional mission data renders an honest empty state.
- Fixture controls are absent in live mode.
- Refresh during movement reconstructs the current snapshot.
- Reduced-motion mode avoids courier tweening and typewriter animation.
- Projected layout fits at 1280×720 without scrolling and reserves the
  top-center VoiceOS-notch safe area.

## Degraded contingency acceptance

Activate this section only when the installed minute-30 VoiceOS probe documents
that background execution is unavailable:

- `dispatch_errand` remains confirmed but is synchronous.
- It posts exactly once and returns the honest initial outbound card.
- The manifest keeps the exact-domain `network` permission and removes
  background-only claims.
- `mission_status` returns the final delivered or denied truth on request.
- The fallback demo ends with an explicit status utterance and never claims an
  automatic completion notification.

All Convex, consent, custody, denial, reset, and projector checks remain
must-pass. The primary background-specific checks are marked as a documented
platform contingency, not silently ignored.

## Planned commands

These commands become mandatory once the implementation scaffold exists:

```sh
bun install
bun run typecheck
bun run test
bun run lint
bun run build
bun run verify:voiceos
```

Development processes:

```sh
bunx convex dev
bun run dev
bun run john
```

## Manual verification

### Golden-path rehearsal

1. Reset demo data.
2. Open the dashboard fullscreen on the mirrored/projected display, hide fixture
   controls, and confirm `CONVEX LIVE`.
3. Start John's terminal on the teammate's computer.
4. Install/reload the RUNNER VoiceOS integration; after any permission change,
   reinstall if needed and confirm `background`, `notify`, and the exact live
   network domain were granted.
5. Speak the exact dispatch line.
6. Approve through VoiceOS by voice.
7. Verify outbound animation and event stream.
8. Hold the rehearsed consent beat, then have John press `Y` about nine seconds
   after the prompt appears.
9. Verify the visible payload handoff and return.
10. Verify VoiceOS visibly opens the delivered card without another utterance.
11. Verify the green dashboard receipt and VoiceOS card name the same holder.

Run the full rehearsal successfully three consecutive times before the demo.
After those golden runs, rehearse one separate recovery run where the presenter
asks `mission_status` if the card is not visibly open by second 63.

### Failure rehearsal

- Run once with John pressing `N`.
- Verify the denied background result/card appears without another utterance.
- Run once with John waiting ten seconds before approval.
- Call synchronous `mission_status` while the background invocation is waiting.
- Run a shortened fixture timeout and verify it reports the nonterminal state.
- Query an unknown exact mission ID and verify `404 MISSION_NOT_FOUND` rather
  than active/latest substitution.
- Run once with the dashboard refreshed during movement.
- Run once with a duplicate approval keypress.
- Run once requesting an item John does not own.

## Performance and reliability targets

- Dispatch mutation commit: under 1 second.
- Reactive UI propagation: under 750 ms on venue Wi-Fi.
- Robot CSS interpolation finishes within each 450 ms authoritative interval
  and never changes logical position by itself.
- Movement interval: 450 ms nominal, no client-side drift requirement.
- Fixed route: 20 scheduled moves × 450 ms = 9 seconds nominal each way,
  excluding dispatch/reactive overhead.
- John approval propagation: under 750 ms.
- Status tool response: under 3 seconds.
- Completion card: within 2 seconds of the monitor observing terminal state.
- Complete golden path after VoiceOS confirmation: 25–45 seconds including the
  brief narrated consent pause.
- Three consecutive demo rehearsals without manual database correction.

## Recommended quality checks

- [ ] Projector readability checked from at least five meters away.
- [ ] Terminal remains legible at 80 columns.
- [ ] Dashboard tells the story without spoken explanation.
- [ ] Robot, charger, walls, desks, and custody remain legible at five meters.
- [ ] The primary mirrored-notch layout and honest two-surface fallback are both
      rehearsed; the webpage contains no imitation VoiceOS card.
- [ ] Colors remain distinguishable with common color-vision deficiencies.
- [ ] Event wording is short, human, and free of implementation jargon.
- [ ] VoiceOS card and dashboard share the same mission terminology.
- [ ] Background completion and manual status produce the same terminal facts.
- [ ] Installed VoiceOS host behavior is recorded: whether current settings
      play the completion chime. The visible automatic card is mandatory; only
      sound is optional.
- [ ] A reset command restores deterministic demo state in under five seconds.

## Future improvements that do not block MVP

- Convex Agent Tool Approval instead of the deterministic approval mutation.
- Automatic rerouting to another coworker after denial.
- Multiple couriers and collision avoidance.
- Authenticated identities and production authorization.
- Physical robot adapter.
- Voice interaction from John's side.

## Final MVP checklist

- [ ] Voice creates the mission with confirmation.
- [ ] Convex visibly drives the live simulation.
- [ ] Separate robot-office component renders obstacles and movement from the
      frozen snapshot contract.
- [ ] John provides real consent from a second terminal.
- [ ] Inventory ownership changes correctly.
- [ ] Courier returns and mission completes.
- [ ] VoiceOS visibly opens the final completion card automatically.
- [ ] Voice accurately reports final status when explicitly asked.
- [ ] Denial works honestly.
- [ ] Automated checks pass.
- [ ] Three golden-path rehearsals pass consecutively.
- [ ] No stretch goal compromises the golden path.
