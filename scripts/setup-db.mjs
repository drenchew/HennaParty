/**
 * Apply Henna Party migrations to Supabase Postgres (skips already-applied files).
 *
 * Requires DATABASE_URL in .env.local (transaction pooler port 6543 on Windows).
 *
 * Storage RLS (20250615000003_storage_rls.sql) is OPTIONAL — apply in SQL Editor
 * only if you want extra lock-down. The app uses service role and works without it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MIGRATION_FILES = [
  "supabase/migrations/20250615000000_henna_party_schema.sql",
  "supabase/migrations/20250615000001_seed_duas.sql",
  "supabase/migrations/20250615000002_dua_acceptance.sql",
  "supabase/migrations/20250617000000_guest_hijabi_media.sql",
  "supabase/migrations/20250618000000_questionnaire_questions.sql",
];

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
`);
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: "require",
  connect_timeout: 30,
});

async function ensureMigrationTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS public._henna_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

async function isMigrationApplied(name) {
  const rows = await sql`
    SELECT 1 FROM public._henna_migrations WHERE name = ${name} LIMIT 1
  `;
  return rows.length > 0;
}

async function markMigrationApplied(name) {
  await sql`
    INSERT INTO public._henna_migrations (name)
    VALUES (${name})
    ON CONFLICT (name) DO NOTHING
  `;
}

/** Backfill tracking for DBs created before migration tracking existed. */
async function bootstrapExistingDatabase() {
  const [guests] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'guests'
    ) AS exists
  `;

  if (!guests?.exists) return;

  const legacy = [
    {
      file: MIGRATION_FILES[0],
      check: async () => true,
    },
    {
      file: MIGRATION_FILES[1],
      check: async () => {
        const [row] = await sql`
          SELECT EXISTS (SELECT 1 FROM public.duas LIMIT 1) AS exists
        `;
        return Boolean(row?.exists);
      },
    },
    {
      file: MIGRATION_FILES[2],
      check: async () => {
        const [row] = await sql`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'duas'
              AND column_name = 'accepted_at'
          ) AS exists
        `;
        return Boolean(row?.exists);
      },
    },
  ];

  for (const { file, check } of legacy) {
    if (await isMigrationApplied(file)) continue;
    if (await check()) {
      await markMigrationApplied(file);
      console.log(`↷ Marked as already applied (existing DB): ${file}`);
    }
  }
}

try {
  await ensureMigrationTable();
  await bootstrapExistingDatabase();

  let applied = 0;
  let skipped = 0;

  for (const file of MIGRATION_FILES) {
    if (await isMigrationApplied(file)) {
      console.log(`⏭ Skipping (already applied): ${file}`);
      skipped += 1;
      continue;
    }

    const filePath = path.join(root, file);
    console.log(`Applying ${file}...`);
    const contents = fs.readFileSync(filePath, "utf8");
    await sql.unsafe(contents);
    await markMigrationApplied(file);
    console.log(`✓ ${file}`);
    applied += 1;
  }

  if (applied === 0) {
    console.log("\n✅ Database is up to date — no new migrations to apply.");
  } else {
    console.log(`\n✅ Applied ${applied} migration(s), skipped ${skipped}.`);
  }

  console.log(
    "\nOptional: run supabase/migrations/20250615000003_storage_rls.sql in the Supabase SQL Editor for extra storage lock-down (skip if it errors — app works without it).",
  );
} catch (error) {
  console.error("\n❌ Migration failed:", error.message);
  process.exit(1);
} finally {
  await sql.end();
}
