import { httpRouter } from "convex/server";
import type { ErrorCode, ErrorEnvelope, SuccessEnvelope } from "../packages/contracts/src/index";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  UNKNOWN_REQUESTER: 400,
  UNKNOWN_TARGET: 400,
  UNKNOWN_ITEM: 400,
  ITEM_NOT_HELD_BY_TARGET: 409,
  COURIER_BUSY: 409,
  NOT_AWAITING_APPROVAL: 409,
  INVALID_ACTOR_TOKEN: 401,
  APPROVAL_ALREADY_RESOLVED: 409,
  MISSION_NOT_FOUND: 404,
  SERVICE_UNAVAILABLE: 503,
};

function jsonResponse(body: SuccessEnvelope | ErrorEnvelope, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function errorResponse(
  code: ErrorCode,
  message: string,
  retryable = false,
  status = STATUS_BY_CODE[code],
): Response {
  return jsonResponse({ ok: false, error: { code, message, retryable } }, status);
}

function authenticate(request: Request, environmentName: string): Response | null {
  const expected = process.env[environmentName];
  if (!expected) {
    return errorResponse("SERVICE_UNAVAILABLE", "Service authentication is not configured.", true);
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return errorResponse("UNAUTHORIZED", "Authentication failed.");
  }
  return null;
}

function errorData(error: unknown): { code: ErrorCode; message: string; retryable: boolean } | null {
  if (!error || typeof error !== "object" || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const candidate = data as { code?: unknown; message?: unknown; retryable?: unknown };
  if (
    typeof candidate.code !== "string" ||
    !(candidate.code in STATUS_BY_CODE) ||
    typeof candidate.message !== "string" ||
    typeof candidate.retryable !== "boolean"
  ) {
    return null;
  }
  return candidate as { code: ErrorCode; message: string; retryable: boolean };
}

function safeErrorResponse(error: unknown): Response {
  const data = errorData(error);
  if (data) return errorResponse(data.code, data.message, data.retryable);
  return errorResponse("SERVICE_UNAVAILABLE", "RUNNER is temporarily unavailable.", true);
}

async function parseObjectBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

http.route({
  path: "/api/v1/voiceos/dispatch",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authFailure = authenticate(request, "RUNNER_REQUESTER_TOKEN");
    if (authFailure) return authFailure;
    const body = await parseObjectBody(request);
    if (!body || body.contractVersion !== 2) {
      return errorResponse("BAD_REQUEST", "contractVersion must be 2.");
    }
    if (typeof body.clientRequestId !== "string" || body.clientRequestId.trim().length === 0) {
      return errorResponse("BAD_REQUEST", "clientRequestId must be a non-empty string.");
    }
    if (body.requesterSlug !== "rushendra") {
      return errorResponse("UNKNOWN_REQUESTER", "Rushendra is the only demo requester.");
    }
    if (body.targetSlug !== "john") {
      return errorResponse("UNKNOWN_TARGET", "John is the only demo handoff target.");
    }
    if (body.itemSlug !== "usb-c-charger") {
      return errorResponse("UNKNOWN_ITEM", "The USB-C charger is the only demo item.");
    }
    try {
      const snapshot = await ctx.runMutation(internal.missions.dispatch, {
        requesterSlug: "rushendra",
        targetSlug: "john",
        itemSlug: "usb-c-charger",
        clientRequestId: body.clientRequestId,
      });
      return jsonResponse({ ok: true, snapshot });
    } catch (error) {
      return safeErrorResponse(error);
    }
  }),
});

http.route({
  path: "/api/v1/voiceos/status",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const authFailure = authenticate(request, "RUNNER_REQUESTER_TOKEN");
    if (authFailure) return authFailure;
    const url = new URL(request.url);
    const hasMissionId = url.searchParams.has("missionId");
    const missionId = url.searchParams.get("missionId");
    try {
      const snapshot = hasMissionId
        ? missionId
          ? await ctx.runQuery(internal.world.snapshotForMission, { missionId })
          : null
        : await ctx.runQuery(api.world.snapshot, {});
      if (!snapshot) {
        return errorResponse("MISSION_NOT_FOUND", "Mission not found.");
      }
      return jsonResponse({ ok: true, snapshot });
    } catch (error) {
      return safeErrorResponse(error);
    }
  }),
});

http.route({
  path: "/api/v1/demo/reset",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authFailure = authenticate(request, "RUNNER_RESET_TOKEN");
    if (authFailure) return authFailure;
    const body = await parseObjectBody(request);
    if (!body || body.contractVersion !== 2) {
      return errorResponse("BAD_REQUEST", "contractVersion must be 2.");
    }
    const resetToken = process.env.RUNNER_RESET_TOKEN;
    if (!resetToken) {
      return errorResponse("SERVICE_UNAVAILABLE", "Service authentication is not configured.", true);
    }
    try {
      const snapshot = await ctx.runMutation(api.demo.reset, { resetToken });
      return jsonResponse({ ok: true, snapshot });
    } catch (error) {
      return safeErrorResponse(error);
    }
  }),
});

export default http;
