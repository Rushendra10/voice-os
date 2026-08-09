# Person 3 — Projected Robot Simulation and Digital Twin

You own every projected pixel the judges see. Build the fullscreen office
digital twin, robot motion, obstacles, cargo/custody visuals, and live Convex
subscription. Work against frozen `WorldSnapshot` fixtures until Person 1 sends
the read-only deployment URL.

Read first:

1. `global-plan.md`, especially **Frozen contract v2**, **Fixed office
   geometry**, **Projected UI component contract**, and the demo script.
2. `docs/SPEC.md`.
3. `docs/EVALS.md`.

Person 2 owns VoiceOS. Do not reproduce VoiceOS cards inside the webpage. Your
surface is a fullscreen browser mirrored to the projector; VoiceOS remains the
real Mac-notch overlay, and John's consent remains a real second terminal.

## Your exclusive files

```text
apps/dashboard/**
```

Do not edit:

```text
package.json
bun.lock
convex.json
.env.example
convex/**
packages/contracts/**
apps/john-terminal/**
integrations/runner/**
coffee-tracker/**
scripts/reset-demo.ts
```

Person 1 owns root packages and lockfiles. Keep all dashboard dependencies and
scripts inside `apps/dashboard` and send Person 1 the nested command names before
the 2:30 merge.

## Your deliverable

By 1:30:

- A deterministic fixture player renders every mission phase.
- `RunnerDashboard({ snapshot })` composes the complete screen.
- `RobotOfficeSimulation({ snapshot })` separately renders the 19×11 office,
  obstacles, route, desks, robot, and cargo.
- The view fits 1280×720 without scrolling and has been seen on the actual
  projected/mirrored display.

By 2:30:

- The dashboard subscribes to live `api.world.snapshot` using Person 1's
  `.convex.cloud` URL.
- Refreshing reconstructs the current authoritative state.
- The full keyboard/API mission produces the correct live robot, custody, and
  terminal visuals.

By 3:30, the exact spoken mission must animate correctly without any dashboard
clicks, local movement timers, or manual state changes.

## Minute-by-minute plan

### 0:00–0:30 — Projector and component kill-risk proof

- Confirm `bun --version` on the dashboard machine; install it immediately if
  absent.
- Scaffold React/Vite inside `apps/dashboard` without touching root files.
- Copy the frozen v2 TypeScript DTO shape locally until Person 1's contract
  package is available.
- Render one static snapshot using the exact 19×11 office, walls, desks, and
  21-point route from `global-plan.md`.
- Create the `RobotOfficeSimulation` component boundary immediately; do not
  start with one monolithic `App.tsx`.
- Put the page fullscreen on the actual 1280×720 projected/mirrored display.
- Jointly with Person 2, run the temporary VoiceOS background probe over the
  fullscreen page and verify the completion card is visible without hiding the
  critical dashboard facts.

Reserve the top-center notch area: keep mission-critical labels out of roughly
the middle 360×96 px at the top. If the VoiceOS overlay does not reproduce on
the projector, freeze the honest two-surface fallback: projector shows the
dashboard while judges view the real completion card on the requester Mac. Do
not fake a VoiceOS card in the webpage.

If the grid does not fit or read clearly by minute 30, remove decoration and
keep only large cells, obstacles, desks, robot, custody, and phase.

### 0:30–1:00 — Pure robot office component

- Render the frozen office grid and obstacle cells.
- Render Rushendra and John at their exact desk coordinates.
- Render the authoritative route without computing a new one.
- Position RUNNER-01 from `snapshot.courier.position`.
- Illuminate visited/current/remaining route cells from `routeIndex`.
- Turn the robot to face the direction of the last authoritative move.
- Attach the charger sprite only when `snapshot.courier.carrying` is non-null.
- Use CSS transitions between snapshots; do not advance movement locally.

### 1:00–1:30 — Complete fixture dashboard

- Create `demoSnapshot.ts` with ordered snapshots for:
  - idle;
  - outbound at start, turn, and John;
  - `awaiting_approval`;
  - `returning_with_item` at John, turn, and Rushendra;
  - `delivered`;
  - `returning_empty`;
  - `denied`;
  - `failed`.
- Build the mission panel, custody rail, and five-event rail.
- Add a development-only fixture player with play/pause/step controls.
- Hide all fixture controls outside explicit fixture mode.
- Run the 1:30 checkpoint on the projector: the UI tells the whole story without
  Convex or narration.

### 1:30–2:10 — Signature custody visuals

- Outbound: cyan route and moving RUNNER-01.
- Waiting: amber hold and John's desk pulse.
- Approval: charger detaches from John and visibly locks onto RUNNER-01.
- Custody rail changes `JOHN → RUNNER-01` in the same rendered snapshot.
- Return: violet route with persistent visible cargo.
- Delivery: custody changes `RUNNER-01 → RUSHENDRA` and a restrained green sweep
  resolves into a readable receipt.
- Denial: RUNNER-01 returns visibly empty and John retains the charger.

The custody transfer is the wow moment. Spend time there before adding texture,
scanlines, or decorative telemetry.

### 2:10–2:30 — Live Convex subscription

- Receive only `VITE_CONVEX_URL` and `CONTRACT_VERSION=2` from Person 1.
- Import the real shared contract/generated API after merge.
- Add `LiveDashboard`, whose only data operation is
  `useQuery(api.world.snapshot)`.
- Keep `RunnerDashboard` and `RobotOfficeSimulation` pure and unchanged.
- Show `CONVEX LIVE` only after a real snapshot arrives.
- Render explicit connecting/error states without inventing mission data.
- Send Person 1 the nested dashboard dev/build/typecheck/test/lint commands.

### 2:30–3:10 — Live visual validation

- Reset through Person 1; do not add a hidden reset button.
- Watch one API/keyboard mission through every live phase.
- Assert courier position equals `mission.path[mission.routeIndex]` at every
  update.
- Confirm walls never move, route cells do not cross obstacles, and cargo follows
  custody.
- Refresh during movement and confirm the page reconstructs current truth.

### 3:10–3:30 — Spoken vertical slice

- Put the dashboard fullscreen with fixture controls hidden.
- Confirm `CONVEX LIVE` before Person 2 speaks.
- Let Person 2 dispatch and Person 1/John approve.
- Touch neither keyboard nor mouse during the judged interaction.
- Verify the automatic VoiceOS completion card and the green dashboard receipt
  report the same holder and outcome.

### 3:30–4:10 — Projector polish

- Check readability from at least five meters away.
- Keep at most three type sizes and five visible events.
- Shorten copy instead of shrinking it.
- Test 1280×720, the actual projector, and `prefers-reduced-motion`.
- Tune only CSS transitions; never change the live 450 ms Convex movement rate.
- Cut scanlines/typewriter effects first if anything drops frames or obscures
  state.

### 4:10–5:00 — Feature freeze and rehearsals

- No new components, libraries, or visual systems after 4:10.
- Run the exact 75-second script three consecutive times from reset.
- Keep the browser fullscreen and hands off after each run begins.
- Record the backup/social video from the same projected composition.
- Fix only failures observed during rehearsal.

## Component architecture

Use React, Vite, and ordinary DOM/CSS. Do not add canvas, WebGL, a game engine,
pathfinding, a physics library, or a UI component suite.

```text
apps/dashboard/
├── package.json
├── src/
│   ├── App.tsx                       # selects explicit fixture/live source
│   ├── LiveDashboard.tsx             # only Convex useQuery wrapper
│   ├── FixtureDashboard.tsx          # development-only fixture player
│   ├── RunnerDashboard.tsx           # pure full-screen composition
│   ├── demoSnapshot.ts               # deterministic v2 snapshots
│   ├── components/
│   │   ├── RobotOfficeSimulation.tsx # separate hero component
│   │   ├── OfficeGrid.tsx
│   │   ├── ObstacleLayer.tsx
│   │   ├── RobotSprite.tsx
│   │   ├── CargoSprite.tsx
│   │   ├── MissionPanel.tsx
│   │   ├── CustodyRail.tsx
│   │   └── EventRail.tsx
│   └── styles.css
└── ...
```

Frozen public component contracts:

```ts
export type RunnerDashboardProps = {
  snapshot: WorldSnapshot;
};

export type RobotOfficeSimulationProps = {
  snapshot: WorldSnapshot;
};
```

`LiveDashboard` may query Convex and pass its result downward. Every other
component is presentational. No component writes Convex, calls the VoiceOS API,
modifies a DTO, schedules movement, or maintains a second authoritative mission
state.

## Robot office rendering contract

- Grid dimensions: 19 columns × 11 rows.
- Rushendra desk: `{ x: 1, y: 7 }`.
- John desk: `{ x: 17, y: 3 }`.
- Obstacles: exactly `snapshot.office.walls`.
- Route: exactly `snapshot.mission.path`, or the frozen route while idle.
- Robot position: exactly `snapshot.courier.position`.
- Robot status and cargo: exactly `snapshot.courier.status/carrying`.
- Route progress: derived from `routeIndex`; never from wall-clock time.
- Transition duration: visually interpolate within the authoritative
  `movementIntervalMs`, with no timer that changes logical state.

The robot may rotate, bob slightly, cast a restrained glow, and transition
between cells. Those are presentation effects, not simulation state.

## Projected layout

```text
┌─ RUNNER NETWORK ─────── [NOTCH SAFE AREA] ───── CONVEX LIVE ─┐
│                                                               │
│  ┌─ ROBOT OFFICE SIMULATION ────┐  ┌─ ACTIVE MISSION ──────┐ │
│  │                              │  │ USB-C CHARGER          │ │
│  │ RUSHENDRA  ▦  RUNNER  ▦ JOHN │  │ JOHN → RUNNER-01      │ │
│  │        route + obstacles     │  │ RETURNING · 68%        │ │
│  └──────────────────────────────┘  └────────────────────────┘ │
│                                                               │
│  004  JOHN APPROVED HANDOFF                                   │
│  005  CUSTODY TRANSFERRED TO RUNNER-01                        │
│  006  RUNNER-01 RETURNING                                     │
└───────────────────────────────────────────────────────────────┘
```

The simulation is the large left-side hero, mission/custody is on the right,
and events run along the bottom. Avoid dense telemetry. The top-center safe area
keeps VoiceOS's real notch UI legible when the built-in display is mirrored.

## Visual system

Theme: **NASA mission control meets an excellent 1980s office terminal.**

```text
idle / neutral         cool gray
outbound               cyan
awaiting_approval      amber
returning_with_item    violet
returning_empty        muted red
delivered              success green
denied / failed        red
```

Rules:

- Near-black background and crisp monospaced typography.
- Large robot, desks, charger, walls, and state labels readable at a distance.
- Obstacles look like office walls/cubicles, not random game blocks.
- Route cells illuminate ahead and dim behind.
- John's desk pulses only while approval is pending.
- Cargo remains unmistakably attached throughout the return.
- Delivery may use one 500–700 ms green sweep, then settles into a receipt.
- Respect `prefers-reduced-motion`; meaning cannot depend on animation.
- Event rail shows at most five short transition events.
- Never draw a fake VoiceOS confirmation, notification, or completion card.

## Fixture and live-source contract

Fixture and live sources both yield one `WorldSnapshot`; presentation code must
not care which source produced it.

- `VITE_RUNNER_MODE=fixture|live` selects the source explicitly; the judged
  build uses `live`.
- Live mode requires `VITE_CONVEX_URL` and subscribes to
  `api.world.snapshot({})`.
- Live mode without a URL fails visibly instead of silently entering fixture
  mode.
- The dashboard needs no requester token because the snapshot query is
  read-only.
- A missing snapshot displays `CONNECTING TO CONVEX`, not fake idle data.
- A query error displays a concise connection error and preserves no stale
  `CONVEX LIVE` badge.

## Person 3 tests worth the time

- Every mission state has the right phase label, color, robot, cargo, custody,
  and event subset.
- The frozen route contains 21 points, starts/ends at the desks, and avoids all
  obstacle cells.
- `routeIndex` zero, the turn, and the final index place the robot correctly.
- Approval attaches the charger once; denial never does.
- Delivered and denied are visually unmistakable.
- `RobotOfficeSimulation` performs no fetches, Convex calls, or logical timers.
- Page refresh reconstructs the current live position.
- Fixture controls are absent in live mode.
- Layout fits 1280×720 with no scroll and preserves the notch safe area.
- Reduced-motion mode remains understandable.
- Dashboard output contains no credentials or VoiceOS setup values.
- Nested typecheck, tests, and production build pass.

## Demo responsibilities

- Connect/mirror the requester Mac to the projector before rehearsal.
- Open the dashboard fullscreen and hide fixture/dev controls.
- Confirm `CONVEX LIVE`, correct reset state, and readable robot/charger icons.
- Tell Person 2 when the display is ready for the spoken request.
- During the run, touch nothing; let Convex drive every visual change.
- Let the amber consent pause and custody-transfer animation breathe.
- End on the green receipt while VoiceOS displays its real completion card.
- If the notch is not mirrored, keep the honest two-surface arrangement practiced
  rather than adding a web imitation.

## Person 3 completion checklist

- [ ] Static grid/projector/notch-safe composition passes by minute 30.
- [ ] Pure `RobotOfficeSimulation` renders grid, obstacles, route, robot, desks,
      and cargo from one `WorldSnapshot`.
- [ ] Fixture player tells every phase by 1:30.
- [ ] No UI component advances or mutates authoritative state.
- [ ] Approval visibly attaches the charger to RUNNER-01.
- [ ] Denial returns an empty courier and leaves charger with John.
- [ ] Custody rail and phase colors tell the story without narration.
- [ ] Live `.convex.cloud` subscription works by 2:30.
- [ ] Refresh reconstructs the current mission.
- [ ] Projector layout fits 1280×720 without scroll.
- [ ] Notch-safe primary display and honest two-surface fallback are tested.
- [ ] Reduced motion stays readable.
- [ ] Exact spoken path succeeds hands-free by 3:30.
- [ ] Nested scripts are handed to Person 1.
- [ ] Three rehearsals and backup recording complete.
- [ ] No Person 1 or Person 2 files or root lockfile were edited.
