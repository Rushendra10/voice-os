import { readFileSync } from "node:fs";

const DEFAULT_CONVEX_SITE_URL = "https://hidden-kingfisher-572.convex.site";

type Snapshot = {
  courier: {
    position: { x: number; y: number };
    status: string;
  };
  item: {
    holder: {
      kind: string;
      slug: string;
    };
  };
  mission: { status: string } | null;
};

type ResetResponse =
  { ok: true; snapshot: Snapshot } | { ok: false; error: { message: string } };

function parseEnvFile(contents: string): Map<string, string> {
  const values = new Map<string, string>();

  for (const line of contents.split(/\r?\n/u)) {
    const match = line.match(
      /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/u,
    );
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue;
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/u, "");
    }
    values.set(key, value);
  }

  return values;
}

function readRepoEnv(): Map<string, string> {
  try {
    return parseEnvFile(
      readFileSync(new URL("../.env.local", import.meta.url), "utf8"),
    );
  } catch {
    return new Map();
  }
}

function envValue(
  name: string,
  repoEnv: Map<string, string>,
): string | undefined {
  const value = process.env[name] ?? repoEnv.get(name);
  return value && value.trim() ? value.trim() : undefined;
}

function isResetResponse(value: unknown): value is ResetResponse {
  if (!value || typeof value !== "object" || !("ok" in value)) return false;
  const envelope = value as { ok: unknown };
  return envelope.ok === true || envelope.ok === false;
}

function fail(message: string): never {
  console.error(`Reset failed · ${message.replace(/\s+/gu, " ").trim()}`);
  process.exit(1);
}

const repoEnv = readRepoEnv();
const resetToken = envValue("RUNNER_RESET_TOKEN", repoEnv);
const siteUrl =
  envValue("CONVEX_SITE_URL", repoEnv) ??
  envValue("RUNNER_API_URL", repoEnv) ??
  DEFAULT_CONVEX_SITE_URL;

if (!resetToken) {
  fail(
    "RUNNER_RESET_TOKEN is required in the environment or repo-root .env.local.",
  );
}

let endpoint: URL;
try {
  endpoint = new URL("/api/v1/demo/reset", siteUrl);
} catch {
  fail("CONVEX_SITE_URL or RUNNER_API_URL is not a valid URL.");
}

try {
  const response = await fetch(endpoint, {
    method: "POST",
    signal: AbortSignal.timeout(5_000),
    headers: {
      Authorization: `Bearer ${resetToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contractVersion: 2 }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    fail(`HTTP ${response.status} returned a non-JSON response.`);
  }

  if (!isResetResponse(payload)) {
    fail(`HTTP ${response.status} returned an invalid response envelope.`);
  }
  if (!response.ok || !payload.ok) {
    fail(payload.ok ? `HTTP ${response.status}.` : payload.error.message);
  }

  const { courier, item, mission } = payload.snapshot;
  console.log(
    `Reset complete · courier=(${courier.position.x},${courier.position.y})/${courier.status} · item holder=${item.holder.kind}:${item.holder.slug} · mission=${mission?.status ?? "none"}`,
  );
} catch (error) {
  if (error instanceof Error) fail(error.message);
  fail("Request failed.");
}
