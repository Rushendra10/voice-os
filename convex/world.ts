import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { latestMission, projectSnapshot } from "./projection";

export const snapshot = query({
  args: {},
  handler: async (ctx) => await projectSnapshot(ctx.db, await latestMission(ctx.db)),
});

export const snapshotForMission = internalQuery({
  args: { missionId: v.string() },
  handler: async (ctx, { missionId }) => {
    const retained = await latestMission(ctx.db);
    if (!retained || retained._id !== missionId) return null;
    const normalizedId = ctx.db.normalizeId("missions", missionId);
    if (!normalizedId || normalizedId !== retained._id) return null;
    return await projectSnapshot(ctx.db, retained);
  },
});
