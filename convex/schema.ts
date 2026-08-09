import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const point = v.object({ x: v.number(), y: v.number() });
const missionStatus = v.union(
  v.literal("outbound"),
  v.literal("awaiting_approval"),
  v.literal("returning_with_item"),
  v.literal("returning_empty"),
  v.literal("delivered"),
  v.literal("denied"),
  v.literal("failed"),
);
const eventType = v.union(
  v.literal("mission_dispatched"),
  v.literal("arrived_at_target"),
  v.literal("approval_requested"),
  v.literal("handoff_approved"),
  v.literal("handoff_denied"),
  v.literal("return_started"),
  v.literal("item_delivered"),
  v.literal("mission_denied"),
  v.literal("mission_failed"),
);

export default defineSchema({
  missions: defineTable({
    clientRequestId: v.string(),
    status: missionStatus,
    requesterSlug: v.literal("rushendra"),
    targetSlug: v.literal("john"),
    itemSlug: v.literal("usb-c-charger"),
    direction: v.union(v.literal("outbound"), v.literal("returning"), v.null()),
    path: v.array(point),
    routeIndex: v.number(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_client_request_id", ["clientRequestId"])
    .index("by_created_at", ["createdAt"]),

  items: defineTable({
    slug: v.literal("usb-c-charger"),
    name: v.string(),
    holderKind: v.union(v.literal("person"), v.literal("courier")),
    holderSlug: v.union(
      v.literal("john"),
      v.literal("runner-01"),
      v.literal("rushendra"),
    ),
  }).index("by_slug", ["slug"]),

  approvals: defineTable({
    missionId: v.id("missions"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
    approverSlug: v.literal("john"),
    requestedAt: v.number(),
    decidedAt: v.optional(v.number()),
  }).index("by_mission_id", ["missionId"]),

  events: defineTable({
    missionId: v.id("missions"),
    sequence: v.number(),
    type: eventType,
    message: v.string(),
    createdAt: v.number(),
  }).index("by_mission_id_and_sequence", ["missionId", "sequence"]),
});
