export const CONTRACT_VERSION = 2 as const;

export type MissionStatus =
  | "outbound"
  | "awaiting_approval"
  | "returning_with_item"
  | "returning_empty"
  | "delivered"
  | "denied"
  | "failed";

export type Point = { x: number; y: number };
export type PersonRef = { slug: string; displayName: string };
export type ItemRef = { slug: string; name: string };
export type HolderRef = {
  kind: "person" | "courier";
  slug: string;
  displayName: string;
};

export type EventType =
  | "mission_dispatched"
  | "arrived_at_target"
  | "approval_requested"
  | "handoff_approved"
  | "handoff_denied"
  | "return_started"
  | "item_delivered"
  | "mission_denied"
  | "mission_failed";

export type EventView = {
  sequence: number;
  type: EventType;
  message: string;
  createdAt: number;
};

export type MissionView = {
  id: string;
  status: MissionStatus;
  requester: PersonRef;
  target: PersonRef;
  item: ItemRef;
  direction: "outbound" | "returning" | null;
  path: Point[];
  routeIndex: number;
  progressPercent: number;
  locationLabel: string;
  etaSeconds: number | null;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

export type ApprovalView = {
  missionId: string;
  status: "pending" | "approved" | "denied";
  approver: PersonRef;
  requestedAt: number;
  decidedAt?: number;
};

export type WorldSnapshot = {
  contractVersion: 2;
  serverNow: number;
  movementIntervalMs: number;
  office: {
    width: number;
    height: number;
    walls: Point[];
    desks: Array<Point & { person: PersonRef }>;
  };
  courier: {
    slug: "runner-01";
    displayName: "RUNNER-01";
    position: Point;
    status: "idle" | "outbound" | "waiting" | "returning";
    carrying: ItemRef | null;
  };
  item: ItemRef & { holder: HolderRef };
  mission: MissionView | null;
  approval: ApprovalView | null;
  events: EventView[];
};

export type SuccessEnvelope = {
  ok: true;
  snapshot: WorldSnapshot;
};

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "UNKNOWN_REQUESTER"
  | "UNKNOWN_TARGET"
  | "UNKNOWN_ITEM"
  | "ITEM_NOT_HELD_BY_TARGET"
  | "COURIER_BUSY"
  | "NOT_AWAITING_APPROVAL"
  | "INVALID_ACTOR_TOKEN"
  | "APPROVAL_ALREADY_RESOLVED"
  | "MISSION_NOT_FOUND"
  | "SERVICE_UNAVAILABLE";

export type ErrorEnvelope = {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type VoiceOSToolResult = {
  contractVersion: 2;
  tool: "dispatch_errand" | "mission_status";
  monitorOutcome: "terminal" | "deadline" | "not_applicable";
  snapshot: WorldSnapshot;
};

export const OFFICE_WIDTH = 19;
export const OFFICE_HEIGHT = 11;

export const RUSHENDRA_DESK: Point = { x: 1, y: 7 };
export const JOHN_DESK: Point = { x: 17, y: 3 };

export const WALLS: Point[] = [
  { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
  { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 },
  { x: 13, y: 6 }, { x: 15, y: 8 }, { x: 16, y: 8 },
];

export const ROUTE: Point[] = [
  { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
  { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 },
  { x: 7, y: 7 }, { x: 7, y: 6 }, { x: 7, y: 5 },
  { x: 7, y: 4 }, { x: 7, y: 3 }, { x: 8, y: 3 },
  { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 11, y: 3 },
  { x: 12, y: 3 }, { x: 13, y: 3 }, { x: 14, y: 3 },
  { x: 15, y: 3 }, { x: 16, y: 3 }, { x: 17, y: 3 },
];
