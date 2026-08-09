import { readFileSync } from "node:fs";

import { ConvexClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

type PendingRequest = {
  missionId: string;
  requester: { slug: string; displayName: string };
  item: { slug: string; name: string };
  requestedAt: number;
};

type Decision = "approved" | "denied";

type DecisionResult = {
  snapshot: unknown;
  replayed: boolean;
};

const DEFAULT_CONVEX_URL = "https://hidden-kingfisher-572.convex.cloud";
const CLEAR_SCREEN = "\u001b[2J\u001b[H";

// These explicit references keep this package runnable while Convex's generated
// API files are being produced by the backend worker in parallel.
const pendingForActor = makeFunctionReference<
  "query",
  { actorToken: string },
  PendingRequest | null
>("approvals:pendingForActor");

const decideApproval = makeFunctionReference<
  "mutation",
  { actorToken: string; missionId: string; decision: Decision },
  DecisionResult
>("approvals:decide");

function parseEnvFile(contents: string): Map<string, string> {
  const values = new Map<string, string>();

  for (const line of contents.split(/\r?\n/u)) {
    const match = line.match(
      /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/u,
    );
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue;
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/u, "");
    }
    values.set(key, value);
  }

  return values;
}

function readRepoEnv(): Map<string, string> {
  try {
    return parseEnvFile(
      readFileSync(new URL("../../../.env.local", import.meta.url), "utf8"),
    );
  } catch {
    return new Map();
  }
}

function envValue(
  name: string,
  repoEnv: Map<string, string>,
): string | undefined {
  const value = process.env[name] ?? repoEnv.get(name);
  return value && value.trim() ? value.trim() : undefined;
}

function sanitizeError(error: unknown): string {
  if (!(error instanceof Error)) return "Backend request failed.";
  if (error.message.includes("APPROVAL_ALREADY_RESOLVED")) {
    return "APPROVAL_ALREADY_RESOLVED";
  }

  const message = error.message.replace(/\s+/gu, " ").trim();
  return message ? message.slice(0, 72) : "Backend request failed.";
}

function idleCard(): string {
  return [
    "┌─ JOHN // RUNNER CONSENT ──────────────────────────────────────┐",
    "│ LINKED TO CONVEX · WAITING FOR REQUEST                         │",
    "└────────────────────────────────────────────────────────────────┘",
  ].join("\n");
}

function pendingCard(request: PendingRequest): string {
  // The MVP data is frozen to these two display strings. Replacing only the
  // values preserves the approved card spacing and keeps the surface narrow.
  return [
    "┌─ INCOMING HANDOFF REQUEST ─────────────────────────────────────┐",
    `│ REQUESTER   ${request.requester.displayName.padEnd(51).slice(0, 51)}│`,
    `│ ITEM        ${request.item.name.padEnd(51).slice(0, 51)}│`,
    "│ COURIER     RUNNER-01 is at your desk                          │",
    "│                                                                │",
    "│ [Y] APPROVE HANDOFF                 [N] DECLINE                 │",
    "└────────────────────────────────────────────────────────────────┘",
  ].join("\n");
}

function decisionLine(decision: Decision, replayed: boolean): string {
  if (decision === "approved") {
    return replayed
      ? "CONSENT ALREADY RECORDED · CUSTODY TRANSFERRED TO RUNNER-01"
      : "CONSENT RECORDED · CUSTODY TRANSFERRED TO RUNNER-01";
  }

  return replayed
    ? "DENIAL ALREADY RECORDED · CHARGER REMAINS WITH JOHN"
    : "DENIAL RECORDED · CHARGER REMAINS WITH JOHN";
}

const repoEnv = readRepoEnv();
const convexUrl = envValue("CONVEX_URL", repoEnv) ?? DEFAULT_CONVEX_URL;
const configuredActorToken = envValue("JOHN_ACTOR_TOKEN", repoEnv);

if (!configuredActorToken) {
  console.error(
    "JOHN_ACTOR_TOKEN is required in the environment or repo-root .env.local.",
  );
  process.exit(1);
}
const actorToken = configuredActorToken as string;

if (!process.stdin.isTTY) {
  console.error("John's consent terminal requires an interactive TTY.");
  process.exit(1);
}

const client = new ConvexClient(convexUrl);
let currentRequest: PendingRequest | null = null;
let inFlight = false;
let lastFrame = "";
let decisionView: { decision: Decision; replayed: boolean } | null = null;
let backendError: string | null = null;
let lastArrivalMissionId: string | null = null;
let unsubscribe: (() => void) | undefined;
let closing = false;

function redraw(options: { bell?: boolean } = {}): void {
  let frame: string;
  if (decisionView) {
    frame = decisionLine(decisionView.decision, decisionView.replayed);
  } else if (currentRequest) {
    frame = pendingCard(currentRequest);
  } else {
    frame = idleCard();
  }

  if (backendError) frame += `\n\nERROR · ${backendError}`;
  if (frame === lastFrame) return;

  lastFrame = frame;
  process.stdout.write(
    `${CLEAR_SCREEN}${frame}\n${options.bell ? "\u0007" : ""}`,
  );
}

async function shutdown(exitCode = 0): Promise<never> {
  if (closing) process.exit(exitCode);
  closing = true;

  unsubscribe?.();
  process.stdin.removeAllListeners("data");
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();

  try {
    await client.close();
  } finally {
    process.stdout.write("\n");
    process.exit(exitCode);
  }
}

async function submitDecision(decision: Decision): Promise<void> {
  if (!currentRequest || inFlight) return;

  const request = currentRequest;
  inFlight = true;
  backendError = null;

  try {
    const result = await client.mutation(decideApproval, {
      actorToken,
      missionId: request.missionId,
      decision,
    });
    currentRequest = null;
    decisionView = { decision, replayed: result.replayed };
  } catch (error) {
    backendError = sanitizeError(error);
  } finally {
    inFlight = false;
    redraw();
  }
}

redraw();

unsubscribe = client.onUpdate(
  pendingForActor,
  { actorToken },
  (request) => {
    backendError = null;

    if (request) {
      const firstArrival = request.missionId !== lastArrivalMissionId;
      lastArrivalMissionId = request.missionId;
      currentRequest = request;
      decisionView = null;
      redraw({ bell: firstArrival });
      return;
    }

    // The subscription commonly observes the approval commit before the
    // mutation promise resolves. Keep the card stable until that result arrives.
    if (inFlight) return;
    currentRequest = null;
    if (!decisionView) redraw();
  },
  (error) => {
    backendError = sanitizeError(error);
    redraw();
  },
);

process.stdin.setEncoding("utf8");
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("data", (input: string) => {
  for (const key of input) {
    if (key === "\u0003") {
      void shutdown(0);
      return;
    }
    if (inFlight) continue;
    if (key === "y" || key === "Y") void submitDecision("approved");
    if (key === "n" || key === "N") void submitDecision("denied");
  }
});

process.once("SIGTERM", () => void shutdown(0));
