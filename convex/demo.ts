import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { runnerError } from "./errors";
import { projectSnapshot } from "./projection";

function requireResetToken(resetToken: string): void {
  const expected = process.env.RUNNER_RESET_TOKEN;
  if (!expected || resetToken !== expected) {
    throw runnerError("UNAUTHORIZED", "Reset authentication failed.");
  }
}

export const reset = mutation({
  args: { resetToken: v.string() },
  handler: async (ctx, { resetToken }) => {
    requireResetToken(resetToken);
    for (const event of await ctx.db.query("events").collect()) await ctx.db.delete(event._id);
    for (const approval of await ctx.db.query("approvals").collect()) await ctx.db.delete(approval._id);
    for (const mission of await ctx.db.query("missions").collect()) await ctx.db.delete(mission._id);
    for (const item of await ctx.db.query("items").collect()) await ctx.db.delete(item._id);
    await ctx.db.insert("items", {
      slug: "usb-c-charger",
      name: "USB-C charger",
      holderKind: "person",
      holderSlug: "john",
    });
    return await projectSnapshot(ctx.db, null);
  },
});
