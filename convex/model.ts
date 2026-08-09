import type { ErrorCode, MissionStatus } from "../packages/contracts/src/index";

export const MOVEMENT_INTERVAL_MS = 450;

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const isTerminalStatus = (status: MissionStatus): boolean =>
  status === "delivered" || status === "denied" || status === "failed";

export const isMovingStatus = (status: MissionStatus): boolean =>
  status === "outbound" || status === "returning_with_item" || status === "returning_empty";

export function validateDispatchSlugs(args: {
  requesterSlug: string;
  targetSlug: string;
  itemSlug: string;
}): void {
  if (args.requesterSlug !== "rushendra") {
    throw new DomainError("UNKNOWN_REQUESTER", "Rushendra is the only demo requester.");
  }
  if (args.targetSlug !== "john") {
    throw new DomainError("UNKNOWN_TARGET", "John is the only demo handoff target.");
  }
  if (args.itemSlug !== "usb-c-charger") {
    throw new DomainError("UNKNOWN_ITEM", "The USB-C charger is the only demo item.");
  }
}

export function planDispatch(input: {
  existingRequest: boolean;
  courierBusy: boolean;
  itemExists: boolean;
  itemHeldByTarget: boolean;
}): "replay" | "create" {
  if (input.existingRequest) return "replay";
  if (input.courierBusy) {
    throw new DomainError("COURIER_BUSY", "RUNNER-01 is already on a mission.");
  }
  if (!input.itemExists) {
    throw new DomainError("UNKNOWN_ITEM", "The USB-C charger is not initialized.");
  }
  if (!input.itemHeldByTarget) {
    throw new DomainError(
      "ITEM_NOT_HELD_BY_TARGET",
      "John does not currently hold the USB-C charger.",
    );
  }
  return "create";
}

export type TickPlan =
  | { kind: "noop" }
  | {
      kind: "move";
      nextRouteIndex: number;
      nextVersion: number;
      nextStatus: MissionStatus;
      nextDirection: "outbound" | "returning" | null;
      arrived: "target" | "requester" | null;
    };

export function planTick(input: {
  status: MissionStatus;
  direction: "outbound" | "returning" | null;
  routeIndex: number;
  version: number;
  expectedVersion: number;
  pathLength: number;
}): TickPlan {
  if (
    input.version !== input.expectedVersion ||
    isTerminalStatus(input.status) ||
    !isMovingStatus(input.status) ||
    input.direction === null
  ) {
    return { kind: "noop" };
  }

  const lastIndex = input.pathLength - 1;
  if (input.direction === "outbound") {
    if (input.routeIndex >= lastIndex) return { kind: "noop" };
    const nextRouteIndex = input.routeIndex + 1;
    return {
      kind: "move",
      nextRouteIndex,
      nextVersion: input.version + 1,
      nextStatus: nextRouteIndex === lastIndex ? "awaiting_approval" : "outbound",
      nextDirection: nextRouteIndex === lastIndex ? null : "outbound",
      arrived: nextRouteIndex === lastIndex ? "target" : null,
    };
  }

  if (input.routeIndex <= 0) return { kind: "noop" };
  const nextRouteIndex = input.routeIndex - 1;
  const terminalStatus = input.status === "returning_with_item" ? "delivered" : "denied";
  return {
    kind: "move",
    nextRouteIndex,
    nextVersion: input.version + 1,
    nextStatus: nextRouteIndex === 0 ? terminalStatus : input.status,
    nextDirection: nextRouteIndex === 0 ? null : "returning",
    arrived: nextRouteIndex === 0 ? "requester" : null,
  };
}

export type ApprovalPlan =
  | { kind: "replay" }
  | {
      kind: "commit";
      missionStatus: "returning_with_item" | "returning_empty";
      transferToCourier: boolean;
    };

export function planApproval(input: {
  missionStatus: MissionStatus;
  approvalStatus: "pending" | "approved" | "denied";
  decision: "approved" | "denied";
}): ApprovalPlan {
  if (input.approvalStatus === input.decision) return { kind: "replay" };
  if (input.approvalStatus !== "pending") {
    throw new DomainError(
      "APPROVAL_ALREADY_RESOLVED",
      "This handoff was already resolved with a different decision.",
    );
  }
  if (input.missionStatus !== "awaiting_approval") {
    throw new DomainError("NOT_AWAITING_APPROVAL", "This mission is not awaiting approval.");
  }
  return input.decision === "approved"
    ? { kind: "commit", missionStatus: "returning_with_item", transferToCourier: true }
    : { kind: "commit", missionStatus: "returning_empty", transferToCourier: false };
}

export function progressPercent(status: MissionStatus, routeIndex: number, pathLength: number): number {
  const lastIndex = Math.max(1, pathLength - 1);
  if (status === "awaiting_approval") return 50;
  if (status === "outbound") return (routeIndex / lastIndex) * 50;
  if (status === "returning_with_item" || status === "returning_empty") {
    return 50 + ((lastIndex - routeIndex) / lastIndex) * 50;
  }
  if (status === "delivered" || status === "denied") return 100;
  return routeIndex === lastIndex ? 50 : (routeIndex / lastIndex) * 50;
}

export function etaSeconds(status: MissionStatus, routeIndex: number, pathLength: number): number | null {
  const lastIndex = pathLength - 1;
  if (status === "awaiting_approval") return null;
  if (status === "outbound") {
    return Math.ceil(((lastIndex - routeIndex) * MOVEMENT_INTERVAL_MS) / 1000);
  }
  if (status === "returning_with_item" || status === "returning_empty") {
    return Math.ceil((routeIndex * MOVEMENT_INTERVAL_MS) / 1000);
  }
  return 0;
}

export function locationLabel(status: MissionStatus, routeIndex: number, pathLength: number): string {
  const lastIndex = pathLength - 1;
  if (status === "awaiting_approval") return "At John's desk";
  if (status === "delivered" || status === "denied") return "At Rushendra's desk";
  if (status === "failed") return "Mission stopped";
  if (routeIndex === 0) return "At Rushendra's desk";
  if (routeIndex === lastIndex) return "At John's desk";
  return status === "outbound" ? "En route to John" : "Returning to Rushendra";
}
