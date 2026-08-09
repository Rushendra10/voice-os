import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { appendEvent } from "./data";
import { rethrowDomainError, runnerError } from "./errors";
import { MOVEMENT_INTERVAL_MS, planApproval } from "./model";
import { CHARGER, latestMission, projectSnapshot, RUSHENDRA } from "./projection";

function requireActorToken(actorToken: string): void {
  const expected = process.env.JOHN_ACTOR_TOKEN;
  if (!expected || actorToken !== expected) {
    throw runnerError("INVALID_ACTOR_TOKEN", "John actor authentication failed.");
  }
}

export const pendingForActor = query({
  args: { actorToken: v.string() },
  handler: async (ctx, { actorToken }) => {
    requireActorToken(actorToken);
    const mission = await latestMission(ctx.db);
    if (!mission || mission.status !== "awaiting_approval") return null;
    const approval = await ctx.db
      .query("approvals")
      .withIndex("by_mission_id", (q) => q.eq("missionId", mission._id))
      .unique();
    if (!approval || approval.status !== "pending") return null;
    return {
      missionId: mission._id,
      requester: RUSHENDRA,
      item: CHARGER,
      requestedAt: approval.requestedAt,
    };
  },
});

export const decide = mutation({
  args: {
    actorToken: v.string(),
    missionId: v.string(),
    decision: v.union(v.literal("approved"), v.literal("denied")),
  },
  handler: async (ctx, { actorToken, missionId, decision }) => {
    requireActorToken(actorToken);
    const normalizedId = ctx.db.normalizeId("missions", missionId);
    if (!normalizedId) throw runnerError("MISSION_NOT_FOUND", "Mission not found.");
    const mission = await ctx.db.get(normalizedId);
    if (!mission) throw runnerError("MISSION_NOT_FOUND", "Mission not found.");
    const approval = await ctx.db
      .query("approvals")
      .withIndex("by_mission_id", (q) => q.eq("missionId", normalizedId))
      .unique();
    if (!approval) throw runnerError("NOT_AWAITING_APPROVAL", "No approval exists for this mission.");

    let plan;
    try {
      plan = planApproval({ missionStatus: mission.status, approvalStatus: approval.status, decision });
    } catch (error) {
      rethrowDomainError(error);
    }
    if (plan.kind === "replay") {
      return { snapshot: await projectSnapshot(ctx.db, mission), replayed: true };
    }

    const item = await ctx.db
      .query("items")
      .withIndex("by_slug", (q) => q.eq("slug", "usb-c-charger"))
      .unique();
    if (!item) throw runnerError("UNKNOWN_ITEM", "The USB-C charger is not initialized.");
    if (
      plan.transferToCourier &&
      !(item.holderKind === "person" && item.holderSlug === "john")
    ) {
      throw runnerError("ITEM_NOT_HELD_BY_TARGET", "John no longer holds the USB-C charger.");
    }

    const now = Date.now();
    const nextVersion = mission.version + 1;
    await ctx.db.patch(approval._id, { status: decision, decidedAt: now });
    if (plan.transferToCourier) {
      await ctx.db.patch(item._id, { holderKind: "courier", holderSlug: "runner-01" });
    }
    await ctx.db.patch(normalizedId, {
      status: plan.missionStatus,
      direction: "returning",
      version: nextVersion,
      updatedAt: now,
    });
    await appendEvent(
      ctx,
      normalizedId,
      decision === "approved" ? "handoff_approved" : "handoff_denied",
      decision === "approved" ? "John approved the charger handoff." : "John declined the charger handoff.",
      now,
    );
    await appendEvent(
      ctx,
      normalizedId,
      "return_started",
      decision === "approved"
        ? "RUNNER-01 is returning with the charger."
        : "RUNNER-01 is returning empty-handed.",
      now,
    );
    await ctx.scheduler.runAfter(MOVEMENT_INTERVAL_MS, internal.movement.tick, {
      missionId: normalizedId,
      expectedVersion: nextVersion,
    });
    const updated = await ctx.db.get(normalizedId);
    if (!updated) throw runnerError("MISSION_NOT_FOUND", "Mission not found.");
    return { snapshot: await projectSnapshot(ctx.db, updated), replayed: false };
  },
});
