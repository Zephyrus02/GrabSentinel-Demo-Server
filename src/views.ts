export function renderTodos(todos: any[]) {
  // Simple server-side HTML rendering
  const rows = todos
    .map(
      (t) => `
      <li>
        <strong>${escapeHtml(t.title || "??")}</strong>
        - completed: ${t.completed}
        <form method="POST" action="/toggle/${t.id}" style="display:inline">
          <button>Toggle</button>
        </form>
        <form method="POST" action="/delete/${t.id}" style="display:inline">
          <button>Delete</button>
        </form>
      </li>`,
    )
    .join("\n");

  return `
  <html>
    <head><title>Buggy Todo App</title></head>
    <body>
      <h1>Todo (buggy)</h1>
      <form method="POST" action="/create">
        <input name="title" placeholder="title" />
        <button>Create</button>
      </form>
      <ul>
        ${rows}
      </ul>
      <p>Endpoints: <a href="/api/todos">/api/todos</a></p>
    </body>
  </html>`;
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
