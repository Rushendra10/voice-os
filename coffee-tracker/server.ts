/** Coffee Tracker — a VoiceOS integration server (standard MCP over stdio). */
import { readFile, writeFile } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// VoiceOS glance helper — inlined; also exported by the integration SDK.
function glanceResult(blocks: Array<Record<string, unknown> & { type: string }>) {
  if (blocks.length === 0 || blocks.length > 3) {
    throw new Error("glanceResult: pass 1-3 blocks");
  }
  return { _voiceos_glance: { blocks } };
}

const jsonResult = (payload: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(payload) }],
});

const LOG_FILE = new URL("./coffee-log.json", import.meta.url);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Entry = { at: string; drink: string; shots: number };

async function readLog(): Promise<Entry[]> {
  try {
    return JSON.parse(await readFile(LOG_FILE, "utf8"));
  } catch {
    return [];
  }
}

function todayCount(entries: Entry[]): number {
  const todayKey = new Date().toDateString();
  return entries.filter((e) => new Date(e.at).toDateString() === todayKey).length;
}

const plural = (n: number) => (n === 1 ? "" : "s");

const server = new McpServer({ name: "coffee-tracker", version: "1.1.0" });

server.registerTool(
  "log_coffee",
  {
    title: "Log coffee",
    description:
      "Log coffee the user drank. Use when the user says they had, drank, or want to log coffee. Call once per request — use count for multiple coffees, never repeated calls.",
    inputSchema: {
      drink: z.string().describe("What they drank, e.g. flat white"),
      shots: z.number().optional().describe("Espresso shots per coffee (default 1)"),
      count: z.number().optional().describe("How many of this coffee to log (default 1)"),
    },
  },
  async ({ drink, shots, count }) => {
    const entries = await readLog();
    const n = Math.max(1, Math.round(count ?? 1));
    const logged: Entry[] = [];
    for (let i = 0; i < n; i++) {
      logged.push({ at: new Date().toISOString(), drink, shots: shots ?? 1 });
    }
    entries.push(...logged);
    await writeFile(LOG_FILE, JSON.stringify(entries, null, 2));
    const today = todayCount(entries);
    return jsonResult({
      logged,
      todayCount: today,
      ...glanceResult([
        { type: "header", title: "Coffee Tracker", icon: "coffee", trailing: "Logged" },
        {
          type: "keyValue",
          pairs: [
            ["Drink", n === 1 ? drink : `${n}× ${drink}`],
            ["Today", `${today} coffee${plural(today)}`],
          ],
        },
      ]),
    });
  },
);

server.registerTool(
  "remove_coffee",
  {
    title: "Remove coffee",
    description:
      "Remove mistakenly logged coffees, most recent first. Use when the user says the log is wrong, too many were logged, or they want to undo, delete, or correct logged coffee.",
    inputSchema: {
      count: z.number().optional().describe("How many recent entries to remove (default 1)"),
      drink: z
        .string()
        .optional()
        .describe("Only remove entries matching this drink, e.g. flat white"),
    },
  },
  async ({ count, drink }) => {
    const entries = await readLog();
    const n = Math.max(1, Math.round(count ?? 1));
    const removed: Entry[] = [];
    for (let i = entries.length - 1; i >= 0 && removed.length < n; i--) {
      if (drink && !entries[i].drink.toLowerCase().includes(drink.toLowerCase())) continue;
      removed.push(...entries.splice(i, 1));
    }
    await writeFile(LOG_FILE, JSON.stringify(entries, null, 2));
    const today = todayCount(entries);
    return jsonResult({
      removed,
      removedCount: removed.length,
      todayCount: today,
      ...glanceResult([
        { type: "header", title: "Coffee Tracker", icon: "coffee", trailing: "Removed" },
        {
          type: "keyValue",
          pairs: [
            ["Removed", `${removed.length} entr${removed.length === 1 ? "y" : "ies"}`],
            ["Today", `${today} coffee${plural(today)}`],
          ],
        },
      ]),
    });
  },
);

server.registerTool(
  "coffee_stats",
  {
    title: "Coffee stats",
    description:
      "Show how much coffee the user has been drinking. Use when the user asks about their coffee habits, count, or stats.",
    inputSchema: {},
  },
  async () => {
    const entries = await readLog();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = entries.filter((e) => new Date(e.at).getTime() > weekAgo);
    // getDay() is Sunday-first; shift so index 0 is Monday.
    const values = DAYS.map(
      (_, i) => recent.filter((e) => (new Date(e.at).getDay() + 6) % 7 === i).length,
    );
    return jsonResult({
      total: entries.length,
      thisWeek: recent.length,
      byWeekday: Object.fromEntries(DAYS.map((d, i) => [d, values[i]])),
      ...glanceResult([
        { type: "header", title: "Coffee Tracker", icon: "coffee", trailing: "This week" },
        {
          type: "stats",
          items: [
            { label: "This week", value: String(recent.length) },
            { label: "All time", value: String(entries.length) },
          ],
        },
        { type: "bars", labels: DAYS, values },
      ]),
    });
  },
);

await server.connect(new StdioServerTransport());
