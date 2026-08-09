import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  robotRequests: defineTable({
    requesterId: v.string(),
    recipientId: v.string(),
    tableLabel: v.string(),
    robotLabel: v.string(),
    note: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("declined")),
    responseNote: v.optional(v.string()),
    respondedAt: v.optional(v.number()),
  })
    .index("by_recipient", ["recipientId", "status"])
    .index("by_requester", ["requesterId", "status"]),

  // One row per authorized dispatch — the hook point for real robot-fleet
  // automation (subscribe to this table, or replace the insert in
  // robotRequests.respond with a scheduler call to your fleet API action).
  dispatches: defineTable({
    requestId: v.id("robotRequests"),
    robotLabel: v.string(),
    tableLabel: v.string(),
    requesterId: v.string(),
    recipientId: v.string(),
  }),
});
