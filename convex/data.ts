import type { EventType } from "../packages/contracts/src/index";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export async function appendEvent(
  ctx: MutationCtx,
  missionId: Id<"missions">,
  type: EventType,
  message: string,
  createdAt: number,
): Promise<void> {
  const latest = await ctx.db
    .query("events")
    .withIndex("by_mission_id_and_sequence", (q) => q.eq("missionId", missionId))
    .order("desc")
    .first();
  await ctx.db.insert("events", {
    missionId,
    sequence: (latest?.sequence ?? 0) + 1,
    type,
    message,
    createdAt,
  });
}
