/**
 * Smoke test — speaks real MCP over stdio to server.ts exactly the way
 * VoiceOS does: handshake, tools/list, then a tools/call per preview fixture.
 *
 * Run after every change: bun verify.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type Fixture = { args: Record<string, unknown>; expectedGlanceBlocks?: number };

let failures = 0;
function check(ok: boolean, label: string) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures++;
}

const here = new URL(".", import.meta.url);
const manifest = await Bun.file(new URL("voiceos.integration.json", here)).json();
const preview = await Bun.file(new URL("voiceos.integration.preview.json", here)).json();

check(manifest.schemaVersion === 1, "manifest schema version is v1");
check(preview.schemaVersion === 1, "preview fixture schema version is v1");

const transport = new StdioClientTransport({
  command: manifest.runtime.command,
  args: manifest.runtime.args,
  cwd: here.pathname,
});
const client = new Client({ name: "voiceos-verify", version: "1.0.0" });
await client.connect(transport);
check(true, "initialize handshake");

const listed = (await client.listTools()).tools;
const listedNames = listed.map((t) => t.name).sort();
const manifestNames = manifest.tools
  .map((t: { name: string }) => t.name)
  .sort();
check(
  JSON.stringify(listedNames) === JSON.stringify(manifestNames),
  `tools match voiceos.integration.json — ${listedNames.join(", ")}`,
);

for (const tool of listed) {
  check(
    typeof tool.description === "string" && tool.description.trim().length > 0,
    `${tool.name} has a model-facing description`,
  );
}

for (const [name, fixture] of Object.entries(preview.tools as Record<string, Fixture>)) {
  const result = await client.callTool({ name, arguments: fixture.args });
  const content = (result.content ?? []) as Array<{ type: string; text?: string }>;
  const text = content.find((c) => c.type === "text")?.text;
  check(typeof text === "string" && text.length > 0, `${name} preview call returns text`);

  let blocks: unknown[] = [];
  try {
    blocks = JSON.parse(text ?? "{}")?._voiceos_glance?.blocks ?? [];
  } catch {
    // leave blocks empty — the check below fails with a clear label
  }
  const inRange = blocks.length >= 1 && blocks.length <= 3;
  const matchesExpected =
    fixture.expectedGlanceBlocks === undefined ||
    blocks.length === fixture.expectedGlanceBlocks;
  check(inRange && matchesExpected, `${name} preview call returns 1-3 glance blocks`);
}

await client.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
