# RUNNER Repository Guidance

## Purpose

This repository contains RUNNER, a VoiceOS-controlled office-agent simulation
backed by Convex. A spoken errand dispatches a simulated courier, a second human
approves or denies the handoff from a terminal, and Convex synchronizes the
movement, inventory, consent, and audit trail in real time.

Before substantial implementation work, read:

- `docs/SPEC.md`
- `docs/EVALS.md`
- `global-plan.md`
- The assigned work brief: `person1.md`, `person2.md`, or `person3.md`

Treat them as the source of truth. Material product changes require updating
the specification and acceptance criteria before implementation.

## Important directories

- `docs/`: product specification and evaluation contract.
- `coffee-tracker/`: disposable VoiceOS integration scaffold/hour-zero probe;
  it is useful only for MCP mechanics and its verifier. RUNNER's planning
  documents override its product/tool semantics, the final integration is a
  separate install in `integrations/runner/`, and the probe is disabled before
  rehearsal.
- `convex/`: planned Convex schema, queries, mutations, and scheduled functions.
- `apps/dashboard/`: Person 3's projected React dashboard, including the pure
  `RobotOfficeSimulation` component.
- `apps/john-terminal/`: planned second-human terminal client.
- `packages/contracts/`: planned frozen shared DTO definitions owned by Person 1.

Directories marked planned may not exist until implementation begins.

## Architectural constraints

- Convex is the sole authoritative simulation state.
- Clients render subscriptions; they do not independently advance the courier.
- Movement is advanced by durable scheduled Convex mutations.
- Approval, item transfer, mission transition, and event append are atomic.
- Scheduled work and approval submissions must be idempotent.
- VoiceOS acting tools require confirmations; read-only tools must not have one.
- `dispatch_errand` is a VoiceOS background tool. Its handler dispatches once,
  monitors the exact returned Convex mission ID, and returns the terminal glance
  card so VoiceOS can surface background completion.
- Its manifest declares `background`, `notify`, and an exact-domain `network`
  permission. `mission_status` stays synchronous and is the recovery path.
- Do not return a dispatch completion result before `delivered`, `denied`, or
  `failed`, except for RUNNER's 90-second monitoring deadline result, which must
  report the current nonterminal state honestly.
- Do not invent or return a custom task handle; background tracking is owned by
  the VoiceOS host.
- Convex never pushes arbitrary UI directly into VoiceOS; the reserved webhook
  permission is not used.
- The projected robot simulation is a separate fullscreen browser component,
  not a VoiceOS card or tmux UI. VoiceOS remains the real notch surface.
- `RunnerDashboard` and `RobotOfficeSimulation` render one `WorldSnapshot` and
  never fetch, mutate Convex, advance `routeIndex`, or own logical timers.
- Obstacles come from `snapshot.office.walls`; the robot follows the frozen
  precomputed route. Do not add pathfinding, collision physics, or fake
  intermediate state.
- The only approved degraded contingency is the one in `global-plan.md`: if the
  installed minute-30 probe proves background unavailable, synchronous
  confirmed dispatch returns the initial card and `mission_status` supplies the
  final card. Never fake proactive completion.
- VoiceOS results contain both model-readable data and user-visible card data.
- VoiceOS widgets are snapshot-only and must not fetch from the network.
- Keep the MVP deterministic. Do not add an LLM where a state machine suffices.
- Use the precomputed demo route; pathfinding is outside the five-hour scope.
- Preserve explicit recipient consent; never auto-approve a handoff.
- Keep demo credentials out of source control and returned tool payloads.

## Planned commands

```sh
bun install
bunx convex dev
bun run dev
bun run john
bun run typecheck
bun run test
bun run lint
bun run build
bun run verify:voiceos
```

Update this file if actual commands differ after scaffolding.

## Repository conventions

- Use TypeScript throughout.
- Validate every public function argument.
- Put state-transition logic in small model functions; keep public Convex
  functions thin.
- Use indexes for mission, approval, and event lookups.
- Await every database write and scheduler operation.
- Record one concise event for every user-visible state transition.
- Prefer explicit status unions over free-form strings.
- Do not duplicate authoritative mission state in clients.
- Keep changes focused; avoid unrelated refactors during the hackathon.

## Required checks before completion

Run all implemented equivalents of:

```sh
bun run typecheck
bun run test
bun run lint
bun run build
bun run verify:voiceos
```

Then execute the manual golden path and relevant failure checks in
`docs/EVALS.md`. A task is not complete if it leaves the golden path less
reliable, even when its isolated tests pass.
