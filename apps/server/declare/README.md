# Declare server

Copy `.env.example` to `.env`, add the provider keys, then run:

```bash
bun run dev
```

The server exposes:

- `GET /health`
- `POST /api/declare/analyze`
- `POST /api/declare/statements`
- `POST /api/superdocs/apply`
- `GET /api/superdocs/jobs/:jobId`
- `POST /api/superdocs/approve`
- `POST /api/superdocs/upload`
- `POST /api/superdocs/export`

`/analyze` uses GLM to propose CRediT roles. `/statements` generates deterministic text from reviewed facts. SuperDocs receives those reviewed statements and returns document changes for researcher approval.
