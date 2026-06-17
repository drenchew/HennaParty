/**
 * Apply all Henna Party migrations to your Supabase Postgres database.
 *
 * Requires DATABASE_URL in .env.local (Supabase Dashboard → Settings → Database)
 *
 * Use the transaction pooler (port 6543) — direct db.* host is IPv6-only and often
 * fails from Node on Windows. This project: aws-1-eu-north-1.
 *
 * Example:
 *   DATABASE_URL=postgresql://postgres.hgxihcjjtwzhamrpzwhb:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
 *
 * Storage RLS (20250615000003_storage_rls.sql) must be applied separately in the SQL Editor.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(`
❌ DATABASE_URL is missing from .env.local

Add your Postgres connection string from:
  Supabase Dashboard → Project Settings → Database → Connection string → URI

Then run:
  npm run db:setup

Or paste supabase/setup-all.sql into:
  https://supabase.com/dashboard/project/hgxihcjjtwzhamrpzwhb/sql/new
`);
  process.exit(1);
}

const migrationFiles = [
  "supabase/migrations/20250615000000_henna_party_schema.sql",
  "supabase/migrations/20250615000001_seed_duas.sql",
  "supabase/migrations/20250615000002_dua_acceptance.sql",
];

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: "require",
  connect_timeout: 30,
});

try {
  for (const file of migrationFiles) {
    const filePath = path.join(root, file);
    console.log(`Applying ${file}...`);
    const contents = fs.readFileSync(filePath, "utf8");
    await sql.unsafe(contents);
    console.log(`✓ ${file}`);
  }
  console.log("\n✅ Database schema applied successfully.");
} catch (error) {
  console.error("\n❌ Migration failed:", error.message);
  process.exit(1);
} finally {
  await sql.end();
}
