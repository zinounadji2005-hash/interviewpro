import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN environment variable is required (get from https://supabase.com/dashboard/account/tokens)");
}
const PROJECT_REF = "qhymsujtkbwdntldcylc";
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

type QueryConfig = string | { text: string; values?: unknown[]; name?: string; rowMode?: string };

type PgResult = {
  rows: Record<string, unknown>[];
  fields: { name: string; dataTypeID: number }[];
  rowCount: number;
  command: string;
};

async function runQuery(sql: string): Promise<PgResult> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const rows = Array.isArray(data) ? data : [];
  const fields = rows.length > 0
    ? Object.keys(rows[0] as Record<string, unknown>).map((name) => ({ name, dataTypeID: 25 }))
    : [];
  return { rows, fields, rowCount: rows.length, command: "SELECT" };
}

class ProxyClient {
  async query(config: QueryConfig, params?: unknown[]): Promise<PgResult> {
    const sql = typeof config === "string" ? config : config.text;
    if (params && params.length > 0) {
      const cleaned = sql.replace(/\$(\d+)/g, (_, i) => {
        const val = params[Number(i) - 1];
        if (val === null) return "NULL";
        if (typeof val === "number") return String(val);
        if (typeof val === "boolean") return val ? "true" : "false";
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return runQuery(cleaned);
    }
    return runQuery(sql);
  }
  release() {}
}

class ProxyPool {
  async query(config: QueryConfig, params?: unknown[]): Promise<PgResult> {
    return new ProxyClient().query(config, params);
  }
  connect(): Promise<ProxyClient> {
    return Promise.resolve(new ProxyClient());
  }
  end() {}
}

export const pool = new ProxyPool() as any;
export const db = drizzle(pool, { schema });
