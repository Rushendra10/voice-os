/** Coffee Tracker — a VoiceOS integration server (standard MCP over stdio). */
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
    return JSON.parse(await Bun.file(LOG_FILE).text());
  } catch {
    return [];
  }
}

const server = new McpServer({ name: "coffee-tracker", version: "1.0.0" });

server.registerTool(
  "log_coffee",
  {
    title: "Log coffee",
    description:
      "Log a coffee the user drank. Use when the user says they had, drank, or want to log a coffee.",
    inputSchema: {
      drink: z.string().describe("What they drank, e.g. flat white"),
      shots: z.number().optional().describe("Espresso shots (default 1)"),
    },
  },
  async ({ drink, shots }) => {
    const entries = await readLog();
    const entry: Entry = { at: new Date().toISOString(), drink, shots: shots ?? 1 };
    entries.push(entry);
    await Bun.write(LOG_FILE, JSON.stringify(entries, null, 2));
    const todayKey = new Date().toDateString();
    const today = entries.filter((e) => new Date(e.at).toDateString() === todayKey).length;
    return jsonResult({
      logged: entry,
      todayCount: today,
      ...glanceResult([
        { type: "header", title: "Coffee Tracker", icon: "coffee", trailing: "Logged" },
        {
          type: "keyValue",
          pairs: [
            ["Drink", drink],
            ["Today", `${today} coffee${today === 1 ? "" : "s"}`],
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
