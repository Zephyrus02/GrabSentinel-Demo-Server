import { Pool } from "pg";
import fs from "fs";

// INTENTIONAL: using different env var names than common Postgres containers
// This will cause connection errors unless envs are explicitly set to these keys.
const pool = new Pool({
  host: process.env.DBHOST || process.env.PGHOST || "localhost",
  user: process.env.DBUSER, // intentionally expects DBUSER (not POSTGRES_USER)
  password: process.env.DBPASSWORD, // intentionally expects DBPASSWORD
  database: process.env.DBNAME, // intentionally expects DBNAME
  port: parseInt(process.env.DBPORT || "5432", 10),
  max: 5,
});

export async function query(text: string, params?: any[]) {
  try {
    console.log("[db] query:", text, params || "");
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error("[db] error:", err && (err as Error).message);
    throw err;
  }
}

export async function initMigrations() {
  try {
    const sql = fs.readFileSync(__dirname + "/../migrations/init.sql", "utf8");
    // INTENTIONAL: run as a single query (may fail on some Postgres settings)
    await pool.query(sql);
    console.log("[db] migrations executed");
  } catch (err) {
    console.error("[db] migration failed:", err && (err as Error).message);
    // Do not rethrow — keep server up for some tests
  }
}
