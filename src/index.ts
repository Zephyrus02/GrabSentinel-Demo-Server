import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { query, initMigrations } from "./db";
import { renderTodos } from "./views";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function start() {
  await initMigrations();
  app.listen(PORT, () => console.log(`Todo app listening on ${PORT}`));
}

function normalizeStatus(status: unknown) {
  return status === "doing" || status === "done" ? status : "todo";
}

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Todo Board API",
    version: "1.0.0",
    description: "API for the kanban-style todo board.",
  },
  servers: [{ url: "http://localhost:3001" }],
  paths: {
    "/api/todos": {
      get: {
        summary: "List todos",
        tags: ["Todos"],
        responses: {
          200: {
            description: "Todo list",
          },
        },
      },
      post: {
        summary: "Create todo",
        tags: ["Todos"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Created todo",
          },
        },
      },
    },
    "/create": {
      post: {
        summary: "Create todo from the web UI",
        tags: ["Todos"],
        responses: {
          302: {
            description: "Redirects back to the board",
          },
        },
      },
    },
    "/toggle/{id}": {
      post: {
        summary: "Cycle a todo through kanban states",
        tags: ["Todos"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          302: {
            description: "Redirects back to the board",
          },
        },
      },
    },
    "/move/{id}/{status}": {
      post: {
        summary: "Move a todo to a specific kanban column",
        tags: ["Todos"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
          {
            name: "status",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: ["todo", "doing", "done"],
            },
          },
        ],
        responses: {
          302: {
            description: "Redirects back to the board",
          },
        },
      },
    },
    "/delete/{id}": {
      post: {
        summary: "Delete a todo",
        tags: ["Todos"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          302: {
            description: "Redirects back to the board",
          },
        },
      },
    },
  },
};

// Health
app.get("/", async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT id, title, completed, status, created_at FROM todo_items ORDER BY id DESC",
    );
    res.send(renderTodos(result.rows));
  } catch (err) {
    console.error(
      "[server] / health check backend query failed",
      err && (err as Error).message,
    );
    res.status(500).send("<html><body><h1>database error</h1></body></html>");
  }
});

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Todo Board API Docs",
  }),
);

// API: list todos
app.get("/api/todos", async (req: Request, res: Response) => {
  try {
    const r = await query(
      "SELECT id, title, completed, status, created_at FROM todo_items ORDER BY id DESC",
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
    const r = await query(
      "INSERT INTO todo_items(title, completed, status) VALUES($1, $2, $3) RETURNING id, title, completed, status, created_at",
      [title, false, "todo"],
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
    await query(
      "INSERT INTO todo_items(title, completed, status) VALUES($1, $2, $3)",
      [req.body.title, false, "todo"],
    );
  } catch (err) {
    console.error("[server] FORM create failed", err && (err as Error).message);
  }
  res.redirect("/");
});

// Move between kanban columns
app.post("/toggle/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    const current = await query("SELECT status FROM todo_items WHERE id = $1", [
      id,
    ]);
    const status = normalizeStatus(current.rows[0]?.status);
    const nextStatus =
      status === "todo" ? "doing" : status === "doing" ? "done" : "todo";
    await query(
      "UPDATE todo_items SET status = $1, completed = $2 WHERE id = $3",
      [nextStatus, nextStatus === "done", id],
    );
  } catch (err) {
    console.error("[server] toggle failed", err && (err as Error).message);
  }
  res.redirect("/");
});

app.post("/move/:id/:status", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const status = normalizeStatus(req.params.status);
  try {
    await query(
      "UPDATE todo_items SET status = $1, completed = $2 WHERE id = $3",
      [status, status === "done", id],
    );
  } catch (err) {
    console.error("[server] move failed", err && (err as Error).message);
  }
  res.redirect("/");
});

// Delete endpoint
app.post("/delete/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    await query("DELETE FROM todo_items WHERE id = $1", [id]);
  } catch (err) {
    console.error("[server] delete failed", err && (err as Error).message);
  }
  res.redirect("/");
});

// Fast endpoint to cause unhandled error intermittently
app.get("/cause-error", (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Global error handler logs stack
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error("[server] unhandled error", error.stack);
  res.status(500).send("internal server error");
});

start().catch((err) => {
  console.error("[server] failed to start", err);
  process.exit(1);
});
