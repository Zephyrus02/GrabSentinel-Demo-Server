import { Pool } from "pg";
import fs from "fs";

const pool = new Pool({
  host:
    process.env.DBHOST ||
    process.env.POSTGRES_HOST ||
    process.env.PGHOST ||
    "localhost",
  user: process.env.DBUSER || process.env.POSTGRES_USER || process.env.PGUSER,
  password: process.env.DBPASSWORD || process.env.POSTGRES_PASSWORD,
  database: process.env.DBNAME || process.env.POSTGRES_DB,
  port: parseInt(
    process.env.DBPORT ||
      process.env.POSTGRES_PORT ||
      process.env.PGPORT ||
      "5432",
    10,
  ),
  max: 5,
});

async function waitForDatabase(maxAttempts = 15, delayMs = 1000) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.log(`[db] waiting for database (${attempt}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("database is unavailable");
}

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
    await waitForDatabase();
    const sql = fs.readFileSync(__dirname + "/../migrations/init.sql", "utf8");
    await pool.query(sql);
    await pool.query(
      "ALTER TABLE todo_items ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'todo'",
    );
    await pool.query(
      "UPDATE todo_items SET status = CASE WHEN completed THEN 'done' ELSE 'todo' END WHERE status IS NULL OR status = ''",
    );
    await pool.query("UPDATE todo_items SET completed = (status = 'done')");
    console.log("[db] migrations executed");
  } catch (err) {
    console.error("[db] migration failed:", err && (err as Error).message);
    throw err;
  }
}
