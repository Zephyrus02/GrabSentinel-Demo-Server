import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { query, initMigrations } from "./db";
import { renderTodos } from "./views";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// initialize migrations (best-effort)
initMigrations();

// Health
app.get("/", async (req: Request, res: Response) => {
  try {
    // INTENTIONAL: calling API that may fail to show errors in logs
    const result = await query("SELECT count(*) FROM todo_items");
    res.send(renderTodos([]));
  } catch (err) {
    console.error(
      "[server] / health check backend query failed",
      err && (err as Error).message,
    );
    // INTENTIONAL: return 200 even when DB check fails
    res.send(
      `<html><body><h1>ok (db check failed: ${(err as Error).message})</h1></body></html>`,
    );
  }
});

// API: list todos
app.get("/api/todos", async (req: Request, res: Response) => {
  try {
    // INTENTIONAL SQL BUG: refer to a non-existent column -> will error
    const r = await query(
      "SELECT id, title, completed FROM todo_items WHERE non_existent_col = false",
    );
    res.json(r.rows);
  } catch (err) {
    console.error(
      "[server] GET /api/todos failed",
      err && (err as Error).message,
    );
    res
      .status(500)
      .json({ error: "db error", details: (err as Error).message });
  }
});

// API: create todo
app.post("/api/todos", async (req: Request, res: Response) => {
  const title = (req.body.title || "").toString();
  try {
    // INTENTIONAL: insert into wrong column name 'name' instead of 'title'
    const r = await query(
      "INSERT INTO todo_items(name, completed) VALUES($1, $2) RETURNING id, title, completed",
      [title, false],
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error(
      "[server] POST /api/todos failed",
      err && (err as Error).message,
    );
    res
      .status(500)
      .json({ error: "insert failed", details: (err as Error).message });
  }
});

// UI create (renders redirect)
app.post("/create", async (req: Request, res: Response) => {
  try {
    await query("INSERT INTO todo_items(title) VALUES($1)", [req.body.title]);
  } catch (err) {
    console.error("[server] FORM create failed", err && (err as Error).message);
  }
  res.redirect("/");
});

// Toggle endpoint with logical bug
app.post("/toggle/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    // INTENTIONAL LOGIC BUG: update id+1 instead of id, so toggling wrong row
    await query(
      "UPDATE todo_items SET completed = NOT completed WHERE id = $1",
      [id + 1],
    );
  } catch (err) {
    console.error("[server] toggle failed", err && (err as Error).message);
  }
  res.redirect("/");
});

// Delete endpoint with random deletion
app.post("/delete/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    // INTENTIONAL BUG: randomly delete a different id sometimes
    const pick =
      Math.random() < 0.3 ? Math.max(1, Math.floor(Math.random() * id)) : id;
    await query("DELETE FROM todo_items WHERE id = $1", [pick]);
  } catch (err) {
    console.error("[server] delete failed", err && (err as Error).message);
  }
  res.redirect("/");
});

// Fast endpoint to cause unhandled error intermittently
app.get("/cause-error", (req: Request, res: Response) => {
  if (Math.random() < 0.5) {
    // INTENTIONAL: throw unhandled exception
    throw new Error("random crash for testing");
  }
  res.json({ ok: true });
});

// Global error handler logs stack
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("[server] unhandled error", err && err.stack);
  res.status(500).send("internal server error");
});

app.listen(PORT, () => console.log(`Buggy todo app listening on ${PORT}`));
