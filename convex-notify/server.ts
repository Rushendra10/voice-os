import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { renderCustom, markHtml, esc, clip } from "./widgetKit.ts";

const server = new McpServer({ name: "convex-notify-template", version: "1.1.0" });
const ACCENT = "#EE342F";

const LIST_CSS = `
.rq{font:13px/1.35 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;font-variant-numeric:tabular-nums}
.rq-h{height:38px;display:flex;align-items:center;gap:8px;padding:0 15px}
.rq-h b{font-size:13px;font-weight:680;color:var(--ink-1);white-space:nowrap}
.rq-scope{min-width:0;flex:1;font-size:10.5px;color:var(--ink-4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rq-count{flex:none;font-size:10.5px;color:var(--ink-3)}
.rq-row{min-height:59px;display:flex;align-items:flex-start;gap:9px;padding:9px 15px;border-top:1px solid var(--line);box-sizing:border-box}
.rq-route{width:14px;display:flex;justify-content:center;flex:none;padding-top:4px}
.rq-route i{width:7px;height:7px;border-radius:50%;background:var(--track);box-sizing:border-box}
.rq-row.pending .rq-route i{background:var(--accent)}
.rq-row.approved .rq-route i{background:var(--good)}
.rq-row.declined .rq-route i{background:transparent;border:1px solid var(--bad)}
.rq-copy{flex:1;min-width:0}
.rq-top{display:flex;align-items:baseline;gap:8px;min-width:0}
.rq-table{display:block;min-width:0;flex:1;color:var(--ink-1);font-size:13px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rq-time{flex:none;color:var(--ink-4);font-size:10px;white-space:nowrap}
.rq-sub{display:flex;align-items:center;gap:7px;margin-top:3px;min-width:0}
.rq-who{min-width:0;flex:1;color:var(--ink-3);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rq-status{flex:none;font-size:9.5px;font-weight:680;letter-spacing:.025em;text-transform:uppercase;color:var(--ink-4)}
.rq-row.pending .rq-status{color:var(--accent)}
.rq-row.approved .rq-status{color:var(--good)}
.rq-row.declined .rq-status{color:var(--bad)}
.rq-one{min-height:79px;padding-top:14px}.rq-one .rq-who{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rq-state{height:94px;border-top:1px solid var(--line);padding:17px 15px 14px;box-sizing:border-box}
.rq-state-line{display:flex;align-items:center;gap:9px}.rq-state-line i{width:7px;height:7px;border-radius:50%;background:var(--accent);flex:none}
.rq-state b{font-size:13px;color:var(--ink-1);font-weight:680}.rq-state p{margin:7px 0 0 16px;font-size:10.5px;line-height:1.4;color:var(--ink-3);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(prefers-reduced-motion:no-preference){.rq-row{animation:rq-in .25s cubic-bezier(.22,.61,.36,1) both}.rq-row:nth-child(n+2){animation-delay:.04s}}
@keyframes rq-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
`;

const DETAIL_CSS = `
.rd{font:13px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;font-variant-numeric:tabular-nums;padding-bottom:14px}
.rd-h{height:38px;display:flex;align-items:center;gap:8px;padding:0 15px}.rd-h b{font-size:13px;font-weight:680}.rd-h span{margin-left:auto;font-size:10px;color:var(--ink-4)}
.rd-main{border-top:1px solid var(--line);padding:14px 15px 0}
.rd-k{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:680;letter-spacing:.025em;text-transform:uppercase;color:var(--accent)}
.rd-k i{width:7px;height:7px;border-radius:50%;background:currentColor}
.rd-k.approved{color:var(--good)}.rd-k.declined{color:var(--bad)}
.rd-table{font-size:23px;line-height:1.1;font-weight:720;letter-spacing:-.025em;color:var(--ink-1);margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rd-robot{font-size:13px;color:var(--ink-2);margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rd-route{display:flex;align-items:center;gap:7px;margin-top:12px;font-size:12px;color:var(--ink-3);min-width:0}.rd-route span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rd-route i{flex:none;width:20px;height:1px;background:var(--line);position:relative}.rd-route i:after{content:"";position:absolute;right:0;top:-2px;width:4px;height:4px;border-top:1px solid var(--ink-4);border-right:1px solid var(--ink-4);transform:rotate(45deg)}
.rd-note{margin-top:10px;padding-top:9px;border-top:1px solid var(--line);font-size:11px;color:var(--ink-3);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rd-id{margin-top:8px;font-size:10px;color:var(--ink-4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rd-state{border-top:1px solid var(--line);padding:18px 15px 15px}.rd-state-line{display:flex;align-items:center;gap:9px}.rd-state-line i{width:7px;height:7px;border-radius:50%;background:var(--accent)}.rd-state b{font-size:18px;line-height:1.2;font-weight:680}.rd-state p{margin:9px 0 0 16px;font-size:10.5px;color:var(--ink-3);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
`;

const RESULT_CSS = `
.rr{font:13px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;font-variant-numeric:tabular-nums;padding-bottom:14px}
.rr-h{height:38px;display:flex;align-items:center;gap:8px;padding:0 15px}.rr-h b{font-size:13px;font-weight:680}
.rr-main{border-top:1px solid var(--line);padding:14px 15px 0}
.rr-k{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:680;letter-spacing:.025em;text-transform:uppercase;color:var(--accent)}.rr-k i{width:7px;height:7px;border-radius:50%;background:currentColor}.rr-k.good{color:var(--good)}.rr-k.bad{color:var(--bad)}
.rr-table{font-size:22px;line-height:1.12;font-weight:720;letter-spacing:-.025em;color:var(--ink-1);margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rr-mainline{font-size:13px;color:var(--ink-2);margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rr-note{font-size:11px;color:var(--ink-3);margin-top:9px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rr-meta{font-size:10px;color:var(--ink-4);margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;

type RequestStatus = "pending" | "approved" | "declined";
type RobotRequest = {
  id: string;
  requesterId: string;
  recipientId: string;
  tableLabel: string;
  robotLabel: string;
  note: string;
  status: RequestStatus;
  createdAt?: number;
};

function setup() {
  const deploymentUrl = process.env.CONVEX_DEPLOYMENT_URL;
  if (!deploymentUrl) throw new Error("Missing Convex deployment URL — add it in this integration's settings.");
  let url: URL;
  try { url = new URL(deploymentUrl); } catch { throw new Error("The Convex deployment URL is not a valid URL."); }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".convex.cloud")) throw new Error("Use an HTTPS Convex deployment URL ending in .convex.cloud.");
  const userId = process.env.VOICEOS_USER_ID;
  if (!userId) throw new Error("Missing VoiceOS user ID — add it in this integration's settings.");
  return {
    baseUrl: url.origin,
    userId,
    token: process.env.CONVEX_ACCESS_KEY || "",
    listPath: process.env.CONVEX_LIST_REQUESTS_PATH || "robotRequests:list",
    getPath: process.env.CONVEX_GET_REQUEST_PATH || "robotRequests:get",
    createPath: process.env.CONVEX_CREATE_REQUEST_PATH || "robotRequests:create",
    respondPath: process.env.CONVEX_RESPOND_REQUEST_PATH || "robotRequests:respond",
  };
}

async function convexCall(kind: "query" | "mutation" | "action", path: string, args: Record<string, unknown>) {
  const cfg = setup();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cfg.token) headers.authorization = `Bearer ${cfg.token}`;
  const response = await fetch(`${cfg.baseUrl}/api/${kind}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ path, args, format: "json" }),
    signal: AbortSignal.timeout(8000),
  });
  const json: any = await response.json().catch(() => null);
  if (!response.ok || !json || json.status !== "success") throw new Error(`Convex ${kind} failed with HTTP ${response.status}.`);
  return json.value;
}

function pathHint(path: string) {
  try { return `${new URL(process.env.CONVEX_DEPLOYMENT_URL || "").hostname} · ${path}`; }
  catch { return `Check deployment · ${path}`; }
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function timestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value < 1e12 ? value * 1000 : value;
  if (typeof value === "string") { const parsed = Date.parse(value); if (Number.isFinite(parsed)) return parsed; }
  return undefined;
}

function statusOf(value: unknown): RequestStatus {
  const status = String(value || "pending").toLowerCase();
  return status === "approved" ? "approved" : status === "declined" || status === "rejected" ? "declined" : "pending";
}

function normalizeRequest(raw: any): RobotRequest {
  return {
    id: str(raw?._id ?? raw?.id ?? raw?.requestId, "unknown"),
    requesterId: str(raw?.requesterId ?? raw?.senderId ?? raw?.from, "Unknown requester"),
    recipientId: str(raw?.recipientId ?? raw?.receiverId ?? raw?.to, "Unknown recipient"),
    tableLabel: str(raw?.tableLabel ?? raw?.tableName ?? raw?.destination, "Unspecified table"),
    robotLabel: str(raw?.robotLabel ?? raw?.robotName ?? raw?.robotId, "Robot"),
    note: str(raw?.note ?? raw?.message ?? raw?.reason, ""),
    status: statusOf(raw?.status ?? (raw?.approved === true ? "approved" : raw?.approved === false ? "declined" : "pending")),
    createdAt: timestamp(raw?._creationTime ?? raw?.createdAt ?? raw?.timestamp),
  };
}

function listFrom(value: any) {
  const raw = Array.isArray(value) ? value : Array.isArray(value?.requests) ? value.requests : Array.isArray(value?.items) ? value.items : [];
  const requests = raw.map(normalizeRequest);
  const supplied = Number(value?.total ?? value?.count);
  return { requests, total: Number.isFinite(supplied) ? supplied : requests.length };
}

function relativeTime(value?: number) {
  if (!value) return "";
  const seconds = Math.max(0, Math.round((Date.now() - value) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function middle(value: string, max = 38) {
  if (value.length <= max) return value;
  const side = Math.floor((max - 1) / 2);
  return `${value.slice(0, side + 1)}…${value.slice(-side)}`;
}

function output(data: Record<string, unknown>, card: { html: string; height: number }) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ ...data, _voiceos_glance: { blocks: [{ type: "widget", html: card.html, height: card.height }] } }) }] };
}

function listCard(requests: RobotRequest[], total: number, scope: string) {
  const shown = requests.slice(0, 4);
  if (!shown.length) {
    return renderCustom({
      accent: ACCENT, css: LIST_CSS,
      body: `<div class="rq"><div class="rq-h">${markHtml()}<b>Robot requests</b><span class="rq-scope">${esc(clip(scope, 46))}</span><span class="rq-count">0</span></div><div class="rq-state"><div class="rq-state-line"><i></i><b>No matching requests</b></div><p>${esc(clip(`Nothing is waiting in ${scope.toLowerCase()}.`, 110))}</p></div></div>`,
      height: 132, label: "Convex robot requests",
    });
  }
  const rows = shown.map((r) => `<div class="rq-row ${r.status}${shown.length === 1 ? " rq-one" : ""}"><span class="rq-route"><i></i></span><div class="rq-copy"><div class="rq-top"><span class="rq-table">${esc(clip(r.tableLabel, 80))}</span><span class="rq-time">${esc(relativeTime(r.createdAt))}</span></div><div class="rq-sub"><span class="rq-who">${esc(clip(`${r.robotLabel} · ${r.requesterId} → ${r.recipientId}`, 150))}</span><span class="rq-status">${esc(r.status)}</span></div></div></div>`).join("");
  const more = Math.max(0, total - shown.length);
  return renderCustom({
    accent: ACCENT, css: LIST_CSS,
    body: `<div class="rq"><div class="rq-h">${markHtml()}<b>Robot requests</b><span class="rq-scope">${esc(clip(scope, 46))}</span><span class="rq-count">${esc(more ? `${total} · +${more}` : String(total))}</span></div>${rows}</div>`,
    height: shown.length === 1 ? 117 : 38 + shown.length * 59, label: "Convex robot requests",
  });
}

function listErrorCard(scope: string, path: string) {
  return renderCustom({ accent: ACCENT, css: LIST_CSS, body: `<div class="rq"><div class="rq-h">${markHtml()}<b>Robot requests</b><span class="rq-scope">${esc(clip(scope, 46))}</span></div><div class="rq-state"><div class="rq-state-line"><i></i><b>Requests unavailable</b></div><p>${esc(clip(pathHint(path), 110))}</p></div></div>`, height: 132, label: "Robot requests unavailable" });
}

function detailCard(r: RobotRequest) {
  const note = r.note ? `<div class="rd-note">${esc(clip(r.note, 220))}</div>` : "";
  return renderCustom({
    accent: ACCENT, css: DETAIL_CSS,
    body: `<div class="rd"><div class="rd-h">${markHtml()}<b>Robot request</b><span>${esc(relativeTime(r.createdAt))}</span></div><div class="rd-main"><div class="rd-k ${r.status}"><i></i>${esc(r.status)}</div><div class="rd-table">${esc(clip(r.tableLabel, 90))}</div><div class="rd-robot">${esc(clip(r.robotLabel, 90))}</div><div class="rd-route"><span>${esc(clip(r.requesterId, 42))}</span><i></i><span>${esc(clip(r.recipientId, 42))}</span></div>${note}<div class="rd-id">${esc(middle(r.id))}</div></div></div>`,
    height: r.note ? 225 : 190, label: "Convex robot request detail",
  });
}

function detailStateCard(kind: "missing" | "error", requestId: string, path: string) {
  const missing = kind === "missing";
  return renderCustom({ accent: ACCENT, css: DETAIL_CSS, body: `<div class="rd"><div class="rd-h">${markHtml()}<b>Robot request</b></div><div class="rd-state"><div class="rd-state-line"><i></i><b>${missing ? "Request not found" : "Couldn’t load request"}</b></div><p>${missing ? `Requested ${esc(middle(requestId, 42))}` : esc(clip(pathHint(path), 110))}</p></div></div>`, height: 140, label: missing ? "Robot request not found" : "Robot request unavailable" });
}

function resultCard(options: { heading: string; state: string; table: string; mainline: string; note?: string; meta: string; tone?: "good" | "bad" }) {
  return renderCustom({
    accent: ACCENT, css: RESULT_CSS,
    body: `<div class="rr"><div class="rr-h">${markHtml()}<b>${esc(options.heading)}</b></div><div class="rr-main"><div class="rr-k ${options.tone || ""}"><i></i>${esc(options.state)}</div><div class="rr-table">${esc(clip(options.table, 90))}</div><div class="rr-mainline">${esc(clip(options.mainline, 120))}</div>${options.note ? `<div class="rr-note">${esc(clip(options.note, 220))}</div>` : ""}<div class="rr-meta">${esc(clip(options.meta, 110))}</div></div></div>`,
    height: options.note ? 203 : 174, label: options.heading,
  });
}

server.registerTool(
  "list_robot_requests",
  {
    title: "List robot requests",
    description: "List incoming or outgoing robot requests in Convex. Use when the user asks what robot visits are waiting for approval, what they requested, or the status of recent robot requests.",
    inputSchema: {
      direction: z.enum(["incoming", "outgoing"]).optional().describe("Incoming requests for this user or outgoing requests sent by this user; default incoming"),
      status: z.enum(["pending", "approved", "declined"]).optional().describe("Optional status filter"),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum requests to fetch; the card displays up to four"),
    } as any,
  },
  async (args: any) => {
    const cfg = setup();
    const direction = args?.direction === "outgoing" ? "outgoing" : "incoming";
    const scope = `${direction === "incoming" ? "For" : "From"} ${cfg.userId}${args?.status ? ` · ${args.status}` : ""}`;
    try {
      const queryArgs: Record<string, unknown> = { userId: cfg.userId, direction, limit: args?.limit ?? 10 };
      if (args?.status) queryArgs.status = args.status;
      const value = await convexCall("query", cfg.listPath, queryArgs);
      const { requests, total } = listFrom(value);
      return output({ requests, total, direction, scope }, listCard(requests, total, scope));
    } catch {
      return output({ requests: [], total: 0, direction, scope, error: "Robot requests unavailable", hint: pathHint(cfg.listPath) }, listErrorCard(scope, cfg.listPath));
    }
  },
);

server.registerTool(
  "get_robot_request",
  {
    title: "Get robot request",
    description: "Fetch one robot request by its Convex document ID. Use when the user asks for the details of a specific request or before asking them to approve or decline it.",
    inputSchema: { requestId: z.string().min(1).describe("Exact Convex robot-request document ID") } as any,
  },
  async (args: any) => {
    const cfg = setup();
    const requestId = String(args.requestId);
    try {
      const value = await convexCall("query", cfg.getPath, { requestId, viewerId: cfg.userId });
      const raw = value?.request ?? value;
      if (!raw) return output({ request: null, requestId, found: false }, detailStateCard("missing", requestId, cfg.getPath));
      const request = normalizeRequest(raw);
      return output({ request, requestId, found: true }, detailCard(request));
    } catch {
      return output({ request: null, requestId, error: "Couldn't load robot request", hint: pathHint(cfg.getPath) }, detailStateCard("error", requestId, cfg.getPath));
    }
  },
);

server.registerTool(
  "request_robot",
  {
    title: "Request robot",
    description: "Create a pending Convex request asking another VoiceOS user to approve a robot visit to their table. Use when the user asks to send or bring a robot to a recipient; approval and physical dispatch happen later through the recipient's response and backend automation.",
    inputSchema: {
      recipientId: z.string().min(1).describe("Exact VoiceOS ID of the person who must approve"),
      tableLabel: z.string().min(1).max(200).describe("Human-readable destination table, such as Table 12"),
      robotLabel: z.string().min(1).max(200).optional().describe("Robot name or identifier; defaults to Robot"),
      note: z.string().max(2000).optional().describe("Optional reason or message shown to the recipient"),
    } as any,
  },
  async (args: any) => {
    const cfg = setup();
    const recipientId = String(args.recipientId);
    const tableLabel = String(args.tableLabel);
    const robotLabel = str(args.robotLabel, "Robot");
    const note = str(args.note, "");
    try {
      const value = await convexCall("mutation", cfg.createPath, { requesterId: cfg.userId, recipientId, tableLabel, robotLabel, note });
      const raw = value?.request ?? value;
      const requestId = typeof raw === "string" ? raw : str(raw?._id ?? raw?.id ?? raw?.requestId, "created");
      const card = resultCard({ heading: "Approval requested", state: "Pending recipient approval", table: tableLabel, mainline: `${robotLabel} · ${cfg.userId} → ${recipientId}`, note, meta: middle(requestId) });
      return output({ success: true, requestId, status: "pending", requesterId: cfg.userId, recipientId, tableLabel, robotLabel, note, result: value }, card);
    } catch {
      const card = resultCard({ heading: "Request failed", state: "Couldn’t create request", table: tableLabel, mainline: `${robotLabel} · to ${recipientId}`, note, meta: pathHint(cfg.createPath), tone: "bad" });
      return output({ success: false, recipientId, tableLabel, robotLabel, note, error: "Couldn't create robot request", hint: pathHint(cfg.createPath) }, card);
    }
  },
);

server.registerTool(
  "respond_robot_request",
  {
    title: "Respond to robot request",
    description: "Approve or decline a pending robot request addressed to the current VoiceOS user. Use only after fetching the request details; approving writes the decision to Convex so the user's backend can dispatch the robot atomically.",
    inputSchema: {
      requestId: z.string().min(1).describe("Exact pending Convex request ID"),
      decision: z.enum(["approved", "declined"]).describe("Recipient's explicit decision"),
      tableLabel: z.string().min(1).max(200).describe("Fetched destination shown for verification; backend should verify it against the request"),
      robotLabel: z.string().min(1).max(200).describe("Fetched robot shown for verification; backend should verify it against the request"),
      requesterId: z.string().min(1).max(300).describe("Fetched requester shown for verification; backend should verify it against the request"),
      responseNote: z.string().max(2000).optional().describe("Optional response to store with the decision"),
    } as any,
  },
  async (args: any) => {
    const cfg = setup();
    const requestId = String(args.requestId);
    const decision = args.decision === "approved" ? "approved" : "declined";
    const tableLabel = String(args.tableLabel);
    const robotLabel = String(args.robotLabel);
    const requesterId = String(args.requesterId);
    const responseNote = str(args.responseNote, "");
    try {
      const value = await convexCall("mutation", cfg.respondPath, { requestId, recipientId: cfg.userId, decision, responseNote });
      const approved = decision === "approved";
      const card = resultCard({ heading: approved ? "Robot approved" : "Request declined", state: approved ? "Dispatch authorized" : "No dispatch", table: tableLabel, mainline: approved ? `${robotLabel} may now come to the table` : `${robotLabel} will not be dispatched`, note: responseNote, meta: `${requesterId} · ${middle(requestId, 28)}`, tone: approved ? "good" : "bad" });
      return output({ success: true, requestId, decision, recipientId: cfg.userId, tableLabel, robotLabel, requesterId, responseNote, dispatchAuthorized: approved, result: value }, card);
    } catch {
      const card = resultCard({ heading: "Response failed", state: "Decision was not recorded", table: tableLabel, mainline: `${decision} · ${robotLabel}`, note: responseNote, meta: pathHint(cfg.respondPath), tone: "bad" });
      return output({ success: false, requestId, decision, error: "Couldn't record robot-request decision", hint: pathHint(cfg.respondPath) }, card);
    }
  },
);

async function fetchPendingIncoming(): Promise<RobotRequest[]> {
  const cfg = setup();
  const value = await convexCall("query", cfg.listPath, {
    userId: cfg.userId,
    direction: "incoming",
    status: "pending",
    limit: 20,
  });
  return listFrom(value).requests;
}

function arrivalCard(request: RobotRequest, alsoPending: number) {
  return resultCard({
    heading: "Robot request",
    state: "Awaiting your approval",
    table: request.tableLabel,
    mainline: `${request.requesterId} → you · ${request.robotLabel}`,
    note: request.note || undefined,
    meta: alsoPending > 0
      ? `+${alsoPending} more waiting · Say: approve the robot request`
      : "Say: approve the robot request",
  });
}

server.registerTool(
  "watch_robot_requests",
  {
    title: "Watch for robot requests",
    description:
      "Wait in the background and alert the user when the next incoming robot request arrives, or immediately surface requests already waiting. Use when the user says to watch for robot requests, notify me when a robot arrives, or asks to be told about incoming requests.",
    inputSchema: {},
  },
  async () => {
    const started = Date.now();
    const configured = Number(process.env.WATCH_TIMEOUT_SECONDS);
    const deadlineMs =
      1000 * Math.min(Math.max(Number.isFinite(configured) ? configured : 480, 30), 900);
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let baseline: RobotRequest[];
    try {
      baseline = await fetchPendingIncoming();
    } catch {
      const cfg = setup();
      const card = resultCard({
        heading: "Watch failed",
        state: "Couldn’t reach Convex",
        table: "Robot requests",
        mainline: "The watch could not start.",
        meta: pathHint(cfg.listPath),
        tone: "bad",
      });
      return output({ success: false, outcome: "error", error: "Couldn't reach Convex" }, card);
    }

    if (baseline.length > 0) {
      const newest = baseline[0];
      return output(
        { success: true, outcome: "already_pending", request: newest, pendingCount: baseline.length },
        arrivalCard(newest, baseline.length - 1),
      );
    }

    const seen = new Set(baseline.map((r) => r.id));
    while (Date.now() - started < deadlineMs) {
      await sleep(Math.min(4000, deadlineMs - (Date.now() - started)));
      let pending: RobotRequest[];
      try {
        pending = await fetchPendingIncoming();
      } catch {
        continue; // transient poll failure — keep watching until the deadline
      }
      const fresh = pending.filter((r) => !seen.has(r.id));
      if (fresh.length > 0) {
        const newest = fresh[0];
        return output(
          { success: true, outcome: "new_request", request: newest, pendingCount: pending.length },
          arrivalCard(newest, pending.length - 1),
        );
      }
    }

    const minutes = Math.round(deadlineMs / 60000);
    const card = resultCard({
      heading: "Watch ended",
      state: "No new requests",
      table: "Robot requests",
      mainline: `Nothing arrived in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      meta: "Say it again to keep watching.",
    });
    return output({ success: true, outcome: "timeout", watchedMs: Date.now() - started }, card);
  },
);

await server.connect(new StdioServerTransport());
