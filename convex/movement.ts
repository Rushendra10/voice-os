import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { appendEvent } from "./data";
import { MOVEMENT_INTERVAL_MS, planTick } from "./model";

export const tick = internalMutation({
  args: {
    missionId: v.id("missions"),
    expectedVersion: v.number(),
  },
  handler: async (ctx, { missionId, expectedVersion }) => {
    const mission = await ctx.db.get(missionId);
    if (!mission) return null;

    const plan = planTick({
      status: mission.status,
      direction: mission.direction,
      routeIndex: mission.routeIndex,
      version: mission.version,
      expectedVersion,
      pathLength: mission.path.length,
    });
    if (plan.kind === "noop") return null;

    const now = Date.now();
    await ctx.db.patch(missionId, {
      routeIndex: plan.nextRouteIndex,
      version: plan.nextVersion,
      status: plan.nextStatus,
      direction: plan.nextDirection,
      updatedAt: now,
      ...(plan.arrived === "requester" ? { completedAt: now } : {}),
    });

    if (plan.arrived === "target") {
      const approval = await ctx.db
        .query("approvals")
        .withIndex("by_mission_id", (q) => q.eq("missionId", missionId))
        .unique();
      if (!approval) {
        await ctx.db.insert("approvals", {
          missionId,
          status: "pending",
          approverSlug: "john",
          requestedAt: now,
        });
      }
      await appendEvent(ctx, missionId, "arrived_at_target", "RUNNER-01 arrived at John's desk.", now);
      await appendEvent(ctx, missionId, "approval_requested", "Waiting for John's consent.", now);
      return null;
    }

    if (plan.arrived === "requester") {
      if (mission.status === "returning_with_item") {
        const item = await ctx.db
          .query("items")
          .withIndex("by_slug", (q) => q.eq("slug", "usb-c-charger"))
          .unique();
        if (item?.holderKind === "courier" && item.holderSlug === "runner-01") {
          await ctx.db.patch(item._id, { holderKind: "person", holderSlug: "rushendra" });
        }
        await appendEvent(ctx, missionId, "item_delivered", "USB-C charger delivered to Rushendra.", now);
      } else {
        await appendEvent(ctx, missionId, "mission_denied", "RUNNER-01 returned without the charger.", now);
      }
      return null;
    }

    await ctx.scheduler.runAfter(MOVEMENT_INTERVAL_MS, internal.movement.tick, {
      missionId,
      expectedVersion: plan.nextVersion,
    });
    return null;
  },
});
