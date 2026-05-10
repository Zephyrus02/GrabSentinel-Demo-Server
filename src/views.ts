export function renderTodos(todos: any[]) {
  const grouped = {
    todo: todos.filter((todo) => todo.status === "todo"),
    doing: todos.filter((todo) => todo.status === "doing"),
    done: todos.filter((todo) => todo.status === "done"),
  };

  return `
  <html>
    <head>
      <title>Todo Board</title>
      <style>
        :root {
          color-scheme: dark;
          --bg: #0f172a;
          --panel: rgba(15, 23, 42, 0.72);
          --panel-strong: rgba(15, 23, 42, 0.92);
          --border: rgba(148, 163, 184, 0.18);
          --text: #e2e8f0;
          --muted: #94a3b8;
          --accent: #38bdf8;
          --accent-2: #22c55e;
          --danger: #fb7185;
          --shadow: 0 24px 80px rgba(2, 6, 23, 0.42);
        }

        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 28%),
            radial-gradient(circle at top right, rgba(34, 197, 94, 0.14), transparent 24%),
            linear-gradient(180deg, #020617 0%, #0f172a 48%, #111827 100%);
          color: var(--text);
        }

        .shell {
          max-width: 1480px;
          margin: 0 auto;
          padding: 40px 24px 64px;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr;
          gap: 20px;
          align-items: end;
          margin-bottom: 24px;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(2.5rem, 5vw, 4.6rem);
          line-height: 0.95;
          letter-spacing: -0.05em;
        }

        .hero p {
          margin: 16px 0 0;
          max-width: 52rem;
          color: var(--muted);
          font-size: 1.02rem;
          line-height: 1.7;
        }

        .panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: var(--shadow);
          backdrop-filter: blur(18px);
        }

        .composer {
          padding: 18px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .composer input {
          flex: 1;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(2, 6, 23, 0.42);
          color: var(--text);
          border-radius: 16px;
          padding: 16px 18px;
          font-size: 1rem;
          outline: none;
        }

        .composer button,
        .btn {
          border: 0;
          border-radius: 14px;
          padding: 14px 16px;
          font-weight: 700;
          color: #020617;
          background: linear-gradient(135deg, #7dd3fc, #22c55e);
          cursor: pointer;
        }

        .board {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 20px;
        }

        .lane {
          padding: 18px;
          min-height: 560px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 22px;
        }

        .lane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .lane-title {
          margin: 0;
          font-size: 0.92rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #cbd5e1;
        }

        .count {
          min-width: 2rem;
          text-align: center;
          border-radius: 999px;
          padding: 0.3rem 0.65rem;
          background: rgba(148, 163, 184, 0.12);
          color: var(--muted);
          font-size: 0.82rem;
        }

        .cards {
          display: grid;
          gap: 14px;
        }

        .card {
          padding: 16px;
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03)),
            var(--panel-strong);
          border: 1px solid rgba(148, 163, 184, 0.16);
          box-shadow: 0 14px 30px rgba(2, 6, 23, 0.2);
        }

        .card-top {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          align-items: start;
        }

        .task-title {
          margin: 0;
          font-size: 1rem;
          line-height: 1.4;
          word-break: break-word;
        }

        .task-meta {
          margin-top: 10px;
          color: var(--muted);
          font-size: 0.86rem;
        }

        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .btn {
          padding: 10px 12px;
          font-size: 0.88rem;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text);
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .btn.primary { background: linear-gradient(135deg, #38bdf8, #60a5fa); color: #020617; }
        .btn.success { background: linear-gradient(135deg, #34d399, #22c55e); color: #052e16; }
        .btn.warn { background: linear-gradient(135deg, #fbbf24, #fb7185); color: #1e1b4b; }
        .btn.danger { background: rgba(248, 113, 113, 0.16); color: #fecaca; }

        .empty {
          padding: 24px 14px;
          color: var(--muted);
          border: 1px dashed rgba(148, 163, 184, 0.22);
          border-radius: 16px;
          text-align: center;
          background: rgba(2, 6, 23, 0.18);
        }

        .footer {
          margin-top: 18px;
          color: var(--muted);
          font-size: 0.92rem;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .footer a { color: #93c5fd; text-decoration: none; }

        @media (max-width: 1024px) {
          .hero,
          .board { grid-template-columns: 1fr; }
          .composer { flex-direction: column; align-items: stretch; }
        }
      </style>
    </head>
    <body>
      <div class="shell">
        <section class="hero">
          <div>
            <h1>Todo Board</h1>
            <p>A polished kanban-style workspace for capturing tasks, moving them across stages, and getting a quick visual read on what is waiting, what is active, and what is done.</p>
          </div>
          <div class="panel composer">
            <form method="POST" action="/create" style="display:flex; gap:12px; width:100%;">
              <input name="title" placeholder="Add a new task" />
              <button type="submit">Create task</button>
            </form>
          </div>
        </section>

        <section class="board">
          ${renderLane("todo", "Backlog", "Tasks waiting to be started.", grouped.todo, "primary", "Start")}
          ${renderLane("doing", "In Progress", "Tasks currently being worked on.", grouped.doing, "success", "Done")}
          ${renderLane("done", "Done", "Completed work and shipped tasks.", grouped.done, "warn", "Reopen")}
        </section>

        <div class="footer">
          <span>API docs: <a href="/docs/">/docs/</a></span>
          <span>Tip: move cards with the action buttons on each card.</span>
        </div>
      </div>
    </body>
  </html>`;
}

function renderLane(
  status: "todo" | "doing" | "done",
  title: string,
  description: string,
  items: any[],
  actionStyle: "primary" | "success" | "warn",
  actionLabel: string,
) {
  return `
    <div class="lane">
      <div class="lane-header">
        <div>
          <h2 class="lane-title">${title}</h2>
          <div class="task-meta">${description}</div>
        </div>
        <div class="count">${items.length}</div>
      </div>
      <div class="cards">
        ${items.length ? items.map((item) => renderCard(item, status, actionStyle, actionLabel)).join("") : `<div class="empty">No tasks here yet.</div>`}
      </div>
    </div>`;
}

function renderCard(
  item: any,
  status: "todo" | "doing" | "done",
  actionStyle: "primary" | "success" | "warn",
  actionLabel: string,
) {
  const nextStatus =
    status === "todo" ? "doing" : status === "doing" ? "done" : "todo";
  const secondaryAction = status === "done" ? "Reopen" : "Move back";

  return `
    <article class="card">
      <div class="card-top">
        <div>
          <h3 class="task-title">${escapeHtml(item.title || "Untitled task")}</h3>
          <div class="task-meta">${item.completed ? "Completed" : "Active"} · ${status.toUpperCase()}</div>
        </div>
      </div>
      <div class="actions">
        <form method="POST" action="/move/${item.id}/${nextStatus}">
          <button class="btn ${actionStyle}" type="submit">${actionLabel}</button>
        </form>
        <form method="POST" action="/toggle/${item.id}">
          <button class="btn" type="submit">Cycle</button>
        </form>
        <form method="POST" action="/delete/${item.id}">
          <button class="btn danger" type="submit">Delete</button>
        </form>
      </div>
    </article>`;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );
}
