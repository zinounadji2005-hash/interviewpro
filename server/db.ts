import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set (e.g. postgresql://user:pass@host:5432/db?sslmode=require).");
}

// Fail fast with a clear message if still using placeholders.
if (
  !/^postgres(ql)?:\/\//.test(databaseUrl) ||
  databaseUrl.includes("YOUR_") ||
  databaseUrl.includes("[") ||
  databaseUrl.includes("]")
) {
  throw new Error(
    "DATABASE_URL is not a valid PostgreSQL URL. Paste the real connection string from Supabase/Neon into .env (no brackets/placeholders).",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
