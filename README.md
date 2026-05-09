# Todo App

This is a small TypeScript-based server-rendered Todo app intentionally seeded with bugs so it can be used to test CodeGuard and IncidentPilot agents. The app renders UI server-side and exposes a few APIs.

Intentional bugs included:

- DB env mismatch: the app expects `DBUSER`, `DBPASSWORD`, `DBNAME` but `docker-compose`/Postgres uses `POSTGRES_USER`/`POSTGRES_PASSWORD` (so DB connection will fail by default).
- `/api/todos` uses a non-existent column `non_existent_col` causing SQL errors.
- `POST /api/todos` inserts into wrong column `name` instead of `title`.
- `POST /toggle/:id` updates `id + 1` instead of `id` (logical bug).
- `POST /delete/:id` randomly deletes a different id sometimes.
- `GET /cause-error` throws an unhandled exception ~50% of the time.
- `initMigrations` swallows migration errors to keep server up (so failures will be logged but not crash the server).

Run locally with Docker Compose (will _intentionally_ produce errors):

```bash
cd test/todo-buggy-app
docker compose up --build
```

Because env names are mismatched, the app will log DB connection failures that CodeGuard can ingest from Datadog.

## Datadog

Run the Datadog agent on the same host (example):

```bash
docker run -d --name dd-agent \
  -e DD_API_KEY=7aea7e23b96cb142edee149f72a38b9d \
  -e DD_SITE="datadoghq.com" \
  -e DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true \
  -e DD_LOGS_ENABLED=true \
  -e DD_LOGS_CONFIG_AUTO_MULTI_LINE_DETECTION=true \
  -e DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true \
  -e DD_CONTAINER_EXCLUDE_LOGS="name:dd-agent" \
  -v /opt/datadog-agent/run:/opt/datadog-agent/run:rw \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc/:/host/proc/:ro \
  -v /sys/fs/cgroup/:/host/sys/fs/cgroup:ro \
  -v /var/lib/docker/containers:/var/lib/docker/containers:ro \
  registry.datadoghq.com/agent:7
```

## Testing

- Visit `http://localhost:3001/` to see the UI.
- Call `GET /api/todos` to trigger the SQL error.
- Call `POST /api/todos` to trigger the insert error.
- Use `/cause-error` to create an uncaught exception.

These failures will produce logs and stack traces that can be routed to CodeGuard via Datadog.
