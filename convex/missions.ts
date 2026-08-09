import { v } from "convex/values";
import { ROUTE } from "../packages/contracts/src/index";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { appendEvent } from "./data";
import { rethrowDomainError, runnerError } from "./errors";
import { isTerminalStatus, MOVEMENT_INTERVAL_MS, planDispatch, validateDispatchSlugs } from "./model";
import { latestMission, projectSnapshot } from "./projection";

export const dispatch = internalMutation({
  args: {
    requesterSlug: v.literal("rushendra"),
    targetSlug: v.literal("john"),
    itemSlug: v.literal("usb-c-charger"),
    clientRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.clientRequestId.trim().length === 0 || args.clientRequestId.length > 200) {
      throw runnerError("BAD_REQUEST", "clientRequestId must be a non-empty opaque identifier.");
    }
    try {
      validateDispatchSlugs(args);
    } catch (error) {
      rethrowDomainError(error);
    }

    const existing = await ctx.db
      .query("missions")
      .withIndex("by_client_request_id", (q) => q.eq("clientRequestId", args.clientRequestId))
      .unique();
    if (existing) return await projectSnapshot(ctx.db, existing);

    const recent = await latestMission(ctx.db);
    const item = await ctx.db
      .query("items")
      .withIndex("by_slug", (q) => q.eq("slug", "usb-c-charger"))
      .unique();
    try {
      planDispatch({
        existingRequest: false,
        courierBusy: recent !== null && !isTerminalStatus(recent.status),
        itemExists: item !== null,
        itemHeldByTarget:
          item?.holderKind === "person" && item.holderSlug === "john",
      });
    } catch (error) {
      rethrowDomainError(error);
    }

    const now = Date.now();
    const missionId = await ctx.db.insert("missions", {
      clientRequestId: args.clientRequestId,
      status: "outbound",
      requesterSlug: "rushendra",
      targetSlug: "john",
      itemSlug: "usb-c-charger",
      direction: "outbound",
      path: ROUTE,
      routeIndex: 0,
      version: 0,
      createdAt: now,
      updatedAt: now,
    });
    await appendEvent(
      ctx,
      missionId,
      "mission_dispatched",
      "RUNNER-01 dispatched for John's USB-C charger.",
      now,
    );
    await ctx.scheduler.runAfter(MOVEMENT_INTERVAL_MS, internal.movement.tick, {
      missionId,
      expectedVersion: 0,
    });
    const mission = await ctx.db.get(missionId);
    if (!mission) throw runnerError("SERVICE_UNAVAILABLE", "Mission creation did not persist.", true);
    return await projectSnapshot(ctx.db, mission);
  },
});
