import type { GenericDatabaseReader } from "convex/server";
import type {
  ApprovalView,
  HolderRef,
  ItemRef,
  MissionStatus,
  PersonRef,
  WorldSnapshot,
} from "../packages/contracts/src/index";
import {
  CONTRACT_VERSION,
  JOHN_DESK,
  OFFICE_HEIGHT,
  OFFICE_WIDTH,
  RUSHENDRA_DESK,
  WALLS,
} from "../packages/contracts/src/index";
import type { DataModel, Doc } from "./_generated/dataModel";
import { runnerError } from "./errors";
import { etaSeconds, locationLabel, MOVEMENT_INTERVAL_MS, progressPercent } from "./model";

type DatabaseReader = GenericDatabaseReader<DataModel>;

export const RUSHENDRA: PersonRef = { slug: "rushendra", displayName: "Rushendra" };
export const JOHN: PersonRef = { slug: "john", displayName: "John" };
export const CHARGER: ItemRef = { slug: "usb-c-charger", name: "USB-C charger" };

export async function latestMission(db: DatabaseReader): Promise<Doc<"missions"> | null> {
  return await db.query("missions").withIndex("by_created_at").order("desc").first();
}

function holderView(item: Doc<"items">): HolderRef {
  if (item.holderKind === "courier") {
    return { kind: "courier", slug: "runner-01", displayName: "RUNNER-01" };
  }
  if (item.holderSlug === "rushendra") {
    return { kind: "person", ...RUSHENDRA };
  }
  return { kind: "person", ...JOHN };
}

function courierStatus(status: MissionStatus | null): WorldSnapshot["courier"]["status"] {
  if (status === "outbound") return "outbound";
  if (status === "awaiting_approval") return "waiting";
  if (status === "returning_with_item" || status === "returning_empty") return "returning";
  return "idle";
}

export async function projectSnapshot(
  db: DatabaseReader,
  mission: Doc<"missions"> | null,
): Promise<WorldSnapshot> {
  const item = await db
    .query("items")
    .withIndex("by_slug", (q) => q.eq("slug", "usb-c-charger"))
    .unique();
  if (!item) {
    throw runnerError("SERVICE_UNAVAILABLE", "Demo state is not initialized. Run reset first.", true);
  }

  let approval: Doc<"approvals"> | null = null;
  let events: Doc<"events">[] = [];
  if (mission) {
    approval = await db
      .query("approvals")
      .withIndex("by_mission_id", (q) => q.eq("missionId", mission._id))
      .unique();
    events = await db
      .query("events")
      .withIndex("by_mission_id_and_sequence", (q) => q.eq("missionId", mission._id))
      .order("desc")
      .take(12);
    events.reverse();
  }

  const approvalView: ApprovalView | null = approval
    ? {
        missionId: approval.missionId,
        status: approval.status,
        approver: JOHN,
        requestedAt: approval.requestedAt,
        ...(approval.decidedAt === undefined ? {} : { decidedAt: approval.decidedAt }),
      }
    : null;
  const position = mission ? mission.path[mission.routeIndex] : RUSHENDRA_DESK;
  if (!position) {
    throw runnerError("SERVICE_UNAVAILABLE", "Mission route state is invalid.", false);
  }

  return {
    contractVersion: CONTRACT_VERSION,
    serverNow: Date.now(),
    movementIntervalMs: MOVEMENT_INTERVAL_MS,
    office: {
      width: OFFICE_WIDTH,
      height: OFFICE_HEIGHT,
      walls: WALLS,
      desks: [
        { ...RUSHENDRA_DESK, person: RUSHENDRA },
        { ...JOHN_DESK, person: JOHN },
      ],
    },
    courier: {
      slug: "runner-01",
      displayName: "RUNNER-01",
      position,
      status: courierStatus(mission?.status ?? null),
      carrying: item.holderKind === "courier" ? CHARGER : null,
    },
    item: {
      slug: item.slug,
      name: item.name,
      holder: holderView(item),
    },
    mission: mission
      ? {
          id: mission._id,
          status: mission.status,
          requester: RUSHENDRA,
          target: JOHN,
          item: CHARGER,
          direction: mission.direction,
          path: mission.path,
          routeIndex: mission.routeIndex,
          progressPercent: progressPercent(mission.status, mission.routeIndex, mission.path.length),
          locationLabel: locationLabel(mission.status, mission.routeIndex, mission.path.length),
          etaSeconds: etaSeconds(mission.status, mission.routeIndex, mission.path.length),
          createdAt: mission.createdAt,
          updatedAt: mission.updatedAt,
          ...(mission.completedAt === undefined ? {} : { completedAt: mission.completedAt }),
        }
      : null,
    approval: approvalView,
    events: events.map((event) => ({
      sequence: event.sequence,
      type: event.type,
      message: event.message,
      createdAt: event.createdAt,
    })),
  };
}
