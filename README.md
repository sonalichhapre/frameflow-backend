# FrameFlow Backend

Express.js backend for the FrameFlow landing page + image-to-video demo.
Ships the static frontend, handles image uploads, simulates video generation,
and collects waitlist emails.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/`  | Serves the FrameFlow frontend |
| `GET`  | `/api/health` | Health check (used by Render) |
| `GET`  | `/api/styles` | List all supported motion styles |
| `POST` | `/api/generate` | Upload image + start generation job |
| `GET`  | `/api/jobs/:id` | Poll job status & progress |
| `GET`  | `/api/download/:id` | Download the processed output |
| `POST` | `/api/waitlist` | Submit email to waitlist |

### POST /api/generate

**Body** — `multipart/form-data`

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `image` | File | — | JPG / PNG / WEBP / HEIC, max 50 MB |
| `style` | string | `cinematic-pan` | See `/api/styles` for all options |
| `resolution` | string | `1080p` | `720p` \| `1080p` \| `4K` |
| `format` | string | `MP4` | `MP4` \| `MOV` \| `GIF` |

**Response 202**
```json
{ "jobId": "abc-123", "message": "Processing started." }
```

### GET /api/jobs/:id

Poll until `status === "done"` or `"error"`.

```json
{
  "id": "abc-123",
  "status": "processing",   // "processing" | "done" | "error"
  "progress": 70,           // 0–100
  "message": "Rendering frames…",
  "style": "cinematic-pan",
  "resolution": "1080p",
  "format": "MP4"
}
```

### POST /api/waitlist

**Body** — JSON `{ "email": "user@example.com" }`

---

## Local Development

```bash
cp .env.example .env
npm install
npm run dev   # node --watch (Node 18+)
```

Visit `http://localhost:3000`

---

## Deploy to Render

### Option A — One-click via render.yaml (recommended)

1. Push this repo to GitHub / GitLab.
2. In [Render Dashboard](https://dashboard.render.com) → **New → Blueprint**.
3. Select your repo — Render reads `render.yaml` automatically.
4. Click **Apply** and wait ~2 minutes for the first deploy.

### Option B — Manual web service

1. **New → Web Service** → connect your repo.
2. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node version:** 18 or higher
3. Add environment variables if needed (see `.env.example`).
4. Click **Create Web Service**.

Render assigns `PORT` automatically — the app reads `process.env.PORT`.

---

## Production Upgrades (when you're ready)

| Feature | Suggestion |
|---------|-----------|
| Persistent job store | Redis (Render add-on) or PostgreSQL |
| Real video generation | FFmpeg on a Render Pro instance or call a GPU API (Replicate, RunwayML) |
| Waitlist emails | Resend or SendGrid — add `RESEND_API_KEY` env var |
| File storage | Cloudflare R2 or AWS S3 instead of local disk |
| Auth | Clerk or Auth0 for paid-tier gating |
