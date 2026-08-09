import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_LABEL = 200;
const MAX_NOTE = 2000;

// Voice agents produce names with arbitrary casing ("Rush" vs "rush"), so all
// user IDs are normalized before storage and lookup.
const normalizeId = (value: string) => value.trim().toLowerCase();

export const list = query({
  args: {
    userId: v.string(),
    direction: v.optional(v.union(v.literal("incoming"), v.literal("outgoing"))),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("declined")),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.round(args.limit ?? 10), 1), 20);
    const outgoing = args.direction === "outgoing";
    const userId = normalizeId(args.userId);
    const base = outgoing
      ? ctx.db
          .query("robotRequests")
          .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      : ctx.db
          .query("robotRequests")
          .withIndex("by_recipient", (q) => q.eq("recipientId", userId));
    const docs = await base.order("desc").collect();
    const filtered = args.status ? docs.filter((d) => d.status === args.status) : docs;
    return { requests: filtered.slice(0, limit), total: filtered.length };
  },
});

export const get = query({
  args: { requestId: v.string(), viewerId: v.optional(v.string()) },
  handler: async (ctx, { requestId, viewerId }) => {
    const id = ctx.db.normalizeId("robotRequests", requestId);
    if (!id) return null;
    const doc = await ctx.db.get(id);
    if (!doc) return null;
    if (viewerId) {
      const viewer = normalizeId(viewerId);
      if (doc.requesterId !== viewer && doc.recipientId !== viewer) return null;
    }
    return doc;
  },
});

export const create = mutation({
  args: {
    requesterId: v.string(),
    recipientId: v.string(),
    tableLabel: v.string(),
    robotLabel: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.requesterId.trim() || !args.recipientId.trim() || !args.tableLabel.trim()) {
      throw new Error("requesterId, recipientId, and tableLabel are required");
    }
    const id = await ctx.db.insert("robotRequests", {
      requesterId: normalizeId(args.requesterId),
      recipientId: normalizeId(args.recipientId),
      tableLabel: args.tableLabel.trim().slice(0, MAX_LABEL),
      robotLabel: (args.robotLabel?.trim() || "Robot").slice(0, MAX_LABEL),
      note: (args.note ?? "").trim().slice(0, MAX_NOTE),
      status: "pending",
    });
    return await ctx.db.get(id);
  },
});

// One-time cleanup: lowercase IDs on rows written before normalization landed.
export const normalizeLegacyIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("robotRequests").collect();
    let patched = 0;
    for (const doc of docs) {
      const requesterId = normalizeId(doc.requesterId);
      const recipientId = normalizeId(doc.recipientId);
      if (requesterId !== doc.requesterId || recipientId !== doc.recipientId) {
        await ctx.db.patch(doc._id, { requesterId, recipientId });
        patched += 1;
      }
    }
    return { patched, total: docs.length };
  },
});

export const respond = mutation({
  args: {
    requestId: v.string(),
    recipientId: v.string(),
    decision: v.union(v.literal("approved"), v.literal("declined")),
    responseNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("robotRequests", args.requestId);
    if (!id) throw new Error("Request not found");
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Request not found");
    if (doc.recipientId !== normalizeId(args.recipientId)) {
      throw new Error("Only the request's recipient can respond");
    }
    if (doc.status !== "pending") throw new Error(`Request is already ${doc.status}`);
    await ctx.db.patch(id, {
      status: args.decision,
      responseNote: (args.responseNote ?? "").trim().slice(0, MAX_NOTE),
      respondedAt: Date.now(),
    });
    if (args.decision === "approved") {
      // Dispatch hook: mutations are atomic, so the decision and the
      // dispatch record commit together. Point real fleet automation here
      // (e.g. ctx.scheduler.runAfter(0, internal.fleet.dispatch, {...})).
      await ctx.db.insert("dispatches", {
        requestId: id,
        robotLabel: doc.robotLabel,
        tableLabel: doc.tableLabel,
        requesterId: doc.requesterId,
        recipientId: doc.recipientId,
      });
    }
    return await ctx.db.get(id);
  },
});
