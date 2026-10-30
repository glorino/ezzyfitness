import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

/*
 * BIGINT (int8) and NUMERIC (numeric) default to strings in node-postgres.
 * Every id/counter in this app fits comfortably in a JS number, so parse them
 * up front — otherwise `id + 1` silently becomes string concatenation.
 */
pg.types.setTypeParser(20, (v) => Number(v)); // int8
pg.types.setTypeParser(1700, (v) => parseFloat(v)); // numeric

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

/** Tiny .env loader so the scripts run with plain `node` (no extra deps). */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
  return process.env;
}

export function dbConfig() {
  const env = loadEnv();
  const url = env.DATABASE_URL;
  if (!url) {
    console.error(
      "\n  [!] DATABASE_URL is missing.\n      Copy `.env.example` to `.env.local` and add your Neon connection string.\n"
    );
    process.exit(1);
  }
  return {
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 20000,
  };
}

export const fmtBytes = (n) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};
