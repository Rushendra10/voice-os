# Robot Delivery Simulation

A 16-bit side-scroller that plays out the convex-notify loop end to end, so the
integration can be demonstrated without two laptops, a Convex deployment, or a
real robot.

Open `index.html`. No build, no server, no dependencies.

## What it shows

Five screens across and two storeys tall, with the camera following the robot:

```
STORE ROOM → SERVICE HALL → MAIN ROOM (tables 4, 9, 12) → LIFT → MEZZANINE (tables 21, 24, 27)
```

One run, repeating:

| Step | On the floor | In the VoiceOS panel |
| --- | --- | --- |
| 1 | — | **Approval requested** · waiting on the recipient |
| 2 | — | **Robot requests** · the pending row on the recipient's laptop |
| 3 | The table approves, by voice or by agent | **Robot approved** · dispatch authorized |
| 4 | Items load onto the tray in the store room | — |
| 5 | The robot drives out, taking the lift when the table is upstairs | — |
| 6 | Items are set down one at a time | — |
| 7 | Thanks from the person, or a silent log from the agent | **Delivery complete** · dispatch closed |
| 8 | The robot returns to dock | **Nothing waiting** |

## The two ways a table approves

- **By voice** — tables 4, 12 and 24. A speech bubble carries the spoken
  approval, and the card quotes it.
- **By agent** — tables 9, 21 and 27. The laptop on the table lights, and the
  card reads *"their agent approved on their behalf"*. Nobody is interrupted.

This mirrors the two paths convex-notify already supports: a person responding
in VoiceOS, or something responding for them.

## Counters

Items delivered, runs completed, and the current destination. Delivered items
also stack visibly on each table.

## Controls

| | |
| --- | --- |
| **Pause** / `Space` | Freeze the floor |
| **1× / 2× / 4×** | Speed |
| **Send a robot** / `S` | Start a run while the robot is docked |

## The card language

The panel across the top is drawn with the same vocabulary `widgetKit` renders:
the `#EE342F` accent, the mark, the uppercase status line, the `--ink` scale,
and the 26px card radius. The markup is written directly rather than imported,
so the simulation stays a single file with nothing to install. If the kit's
styling changes, this panel needs the same change by hand.

## What is simulated

Everything. No network calls, no Convex deployment is contacted, and no rows are
written. The names, table labels and request ids are stand-ins shaped like the
real ones.
