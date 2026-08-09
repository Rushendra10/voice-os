/**
 * Robot-request notification watcher — run this on the RECIPIENT's laptop.
 *
 * VoiceOS tools are pull-only: the agent checks Convex only when spoken to.
 * This watcher fills the push gap — it polls the shared deployment and fires
 * a native macOS notification the moment a new pending request arrives, so
 * the recipient knows to ask VoiceOS to review it (or just clicks approve by
 * voice: "approve the robot request").
 *
 * Usage:
 *   CONVEX_DEPLOYMENT_URL=https://<deployment>.convex.cloud \
 *   VOICEOS_USER_ID=<your-user-id> \
 *   bun notify-watcher.ts        # or: node notify-watcher.ts (node >= 23.6)
 */
import { execFile } from "node:child_process";

const deploymentUrl = process.env.CONVEX_DEPLOYMENT_URL;
const userId = process.env.VOICEOS_USER_ID;
if (!deploymentUrl || !userId) {
  console.error("Set CONVEX_DEPLOYMENT_URL and VOICEOS_USER_ID env vars.");
  process.exit(1);
}
const listPath = process.env.CONVEX_LIST_REQUESTS_PATH || "robotRequests:list";
const pollMs = Math.max(2000, Number(process.env.POLL_INTERVAL_MS) || 5000);

type RobotRequest = {
  _id: string;
  requesterId: string;
  tableLabel: string;
  robotLabel: string;
  note: string;
};

async function fetchPending(): Promise<RobotRequest[]> {
  const response = await fetch(`${new URL(deploymentUrl!).origin}/api/query`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      path: listPath,
      args: { userId, direction: "incoming", status: "pending", limit: 20 },
      format: "json",
    }),
    signal: AbortSignal.timeout(8000),
  });
  const json = (await json_(response)) as { status?: string; value?: { requests?: RobotRequest[] } } | null;
  if (!response.ok || json?.status !== "success") {
    throw new Error(`Convex query failed with HTTP ${response.status}`);
  }
  return json.value?.requests ?? [];
}

const json_ = (r: Response) => r.json().catch(() => null);

function notify(request: RobotRequest) {
  const title = "Robot request";
  const body = `${request.requesterId} wants to send ${request.robotLabel} to ${request.tableLabel}. Ask VoiceOS to approve or decline.`;
  const script = `display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)} sound name "Glass"`;
  execFile("osascript", ["-e", script], (err) => {
    if (err) console.error("notification failed:", err.message);
  });
  console.log(`[${new Date().toLocaleTimeString()}] ${body}`);
}

async function fetchOutgoing(): Promise<Array<RobotRequest & { recipientId: string; status: string }>> {
  const response = await fetch(`${new URL(deploymentUrl!).origin}/api/query`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      path: listPath,
      args: { userId, direction: "outgoing", limit: 20 },
      format: "json",
    }),
    signal: AbortSignal.timeout(8000),
  });
  const json = (await json_(response)) as { status?: string; value?: { requests?: Array<RobotRequest & { recipientId: string; status: string }> } } | null;
  if (!response.ok || json?.status !== "success") {
    throw new Error(`Convex query failed with HTTP ${response.status}`);
  }
  return json.value?.requests ?? [];
}

function notifyRaw(title: string, body: string) {
  const script = `display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)} sound name "Glass"`;
  execFile("osascript", ["-e", script], (err) => {
    if (err) console.error("notification failed:", err.message);
  });
  console.log(`[${new Date().toLocaleTimeString()}] ${title}: ${body}`);
}

const seen = new Set<string>();
const outcomeSeen = new Map<string, string>();
let first = true;

async function tick() {
  try {
    const pending = await fetchPending();
    for (const request of pending) {
      if (seen.has(request._id)) continue;
      seen.add(request._id);
      if (!first) notify(request);
    }
    if (first && pending.length) {
      notifyRaw(
        "Robot requests waiting",
        `${pending.length} request${pending.length === 1 ? "" : "s"} awaiting your approval. Ask VoiceOS: "any robot requests?"`,
      );
    }
    const outgoing = await fetchOutgoing();
    for (const request of outgoing) {
      const previous = outcomeSeen.get(request._id);
      outcomeSeen.set(request._id, request.status);
      if (previous !== "pending" || request.status === "pending") continue;
      const verb = request.status === "approved" ? "approved" : "declined";
      notifyRaw(
        `Robot request ${verb}`,
        `${request.recipientId} ${verb} your request — ${request.robotLabel} to ${request.tableLabel}.`,
      );
    }
    first = false;
  } catch (error) {
    console.error("poll failed:", error instanceof Error ? error.message : error);
  }
}

console.log(`Watching ${new URL(deploymentUrl!).hostname} for robot requests to ${userId} (every ${pollMs / 1000}s)…`);
await tick();
setInterval(tick, pollMs);
