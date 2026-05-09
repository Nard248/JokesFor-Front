# Hosting Setup — Firebase + Cloud Run

Status: **Live, working via direct Cloud Run URL + CORS** (as of 2026-05-09).
The cross-project Firebase Hosting → Cloud Run proxy was attempted and abandoned — Firebase Hosting's API does not support cross-project Cloud Run rewrites. Document below captures everything tried, the current production state, the pre-demo checklist, and the future migration option if you want to revisit the proxy.

---

## 1. Architecture (current)

```
┌────────────────────────────────────────┐         ┌────────────────────────────────────────┐
│ jokesforfront (GCP project)             │         │ jokesfor (GCP project)                  │
│ project number 77998926066              │         │ project number 332865216810             │
│                                          │         │                                          │
│ Firebase Hosting                         │         │ Cloud Run                                │
│   ├─ jokesfor.net (custom domain)        │         │   └─ jokesforbackend (Django)            │
│   ├─ jokesforfront.web.app               │ ◀══════│        us-east1                          │
│   └─ jokesforfront.firebaseapp.com       │  CORS   │        URL:                              │
│                                          │         │        https://jokesforbackend-          │
│ GitHub Actions service account           │         │        332865216810.us-east1.run.app     │
│   github-action-1192566766@...           │         │                                          │
│                                          │         │ Cloud SQL / other backend services       │
│ Billing: 0110D0-05D2F9-E4EDC3            │         │                                          │
└────────────────────────────────────────┘         │ Billing: 0110D0-05D2F9-E4EDC3            │
                                                    └────────────────────────────────────────┘
```

- **Frontend** (this repo): Vite + React 19 + React Router 7, deployed to Firebase Hosting in `jokesforfront`.
- **Backend** (separate repo): Django, deployed to Cloud Run as service `jokesforbackend` in `jokesfor` project, region `us-east1`.
- **Browser ↔ frontend**: served from Firebase Hosting CDN via `jokesfor.net` or `jokesforfront.web.app`.
- **Frontend ↔ backend**: cross-origin XHR with `withCredentials: true` (cookies cross over). CORS allowlist on Django gates which origins can talk to it.

---

## 2. Today's commits (latest first)

| SHA       | Message                                                              |
| --------- | -------------------------------------------------------------------- |
| `46565ab` | revert: drop firebase /api proxy, point at cloud run url directly   |
| `e99db23` | feat: add projectId to cloud run rewrite (cross-project)            |
| `d1891de` | feat: proxy /api to cloud run jokesforbackend                       |
| `e8706f2` | fix: drop platform-specific native deps for cross-platform ci       |
| `ff65312` | feat: add wip features, pages, and api updates                      |
| `542222c` | chore: set up firebase hosting and analytics                        |

`46565ab` is the current head and represents the working state.

---

## 3. What we configured

### Files in this repo
- `firebase.json` — Firebase Hosting config: `dist/` as public dir, SPA catchall rewrite (`** → /index.html`), two-tier cache headers (immutable for hashed assets, no-cache for `index.html`).
- `.firebaserc` — default project alias `jokesforfront`.
- `src/lib/firebase.ts` — Firebase JS SDK init (app + Analytics, gated by `isSupported()`).
- `src/main.tsx` — imports `./lib/firebase` so init runs at startup.
- `src/vite-env.d.ts` — typed `import.meta.env` for `VITE_FIREBASE_*` keys.
- `.env` (gitignored) — local-dev env vars including `VITE_API_URL=http://localhost:8000/api/v1` and `VITE_USE_MOCKS=true`.
- `.env.example` — placeholder list of every `VITE_*` key for new contributors.
- `.gitignore` — added `.playwright-mcp/`, `.claude/`, `.agents/`, `~$*.docx`, Firebase debug logs, and `skills-lock.json`.
- `.github/workflows/firebase-hosting-merge.yml` — auto-deploy on push to `main`. Build step receives all `VITE_FIREBASE_*` from secrets plus `VITE_API_URL` and `VITE_USE_MOCKS` (with prod-correct defaults baked in as workflow fallbacks).
- `.github/workflows/firebase-hosting-pull-request.yml` — same env injection, deploys to a preview channel per PR.

### GitHub repository secrets (8)
- `FIREBASE_SERVICE_ACCOUNT_JOKESFORFRONT` — created by `firebase init hosting:github`, used by the deploy step.
- `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_MEASUREMENT_ID` (7) — frontend Firebase web SDK config.

### GCP changes made on `jokesforfront`
- Billing account `0110D0-05D2F9-E4EDC3` linked.
- Cloud Run Admin API and Cloud Functions API enabled (these were only required for the proxy attempt; harmless to leave on).
- Firebase Hosting custom domain bound to `jokesfor.net`.

### GCP changes made on `jokesfor`
- None (no IAM grant happened — the cross-project proxy plan was abandoned before that step).

---

## 4. The proxy plan we attempted (and why it failed)

Original goal: have `jokesfor.net/api/**` route through Firebase Hosting to the Cloud Run backend so the browser sees a single origin (no CORS, simpler cookies, internal-network proxy).

We added this rewrite to `firebase.json`:

```json
"rewrites": [
  {
    "source": "/api/**",
    "run": { "serviceId": "jokesforbackend", "region": "us-east1" }
  },
  { "source": "**", "destination": "/index.html" }
]
```

The deploy failed three times with progressively different errors:

1. **Cloud Run Admin API and Cloud Functions API disabled on `jokesforfront`** — fixed by enabling both APIs. Required attaching billing first.
2. **`Cloud Run service jokesforbackend does not exist in region us-east1 in this project`** — Firebase looked for the service in `jokesforfront` instead of `jokesfor` because there is no way to specify a different project.

We tried adding `"projectId": "jokesfor"` to the rewrite. The firebase-tools CLI silently dropped this field — the API request body sent to Firebase Hosting only contained `serviceId` and `region`. Confirmed by inspecting the deploy step's debug log:

```
PATCH .../versions/...
body: {"rewrites":[
  {"glob":"/api/**","run":{"serviceId":"jokesforbackend","region":"us-east1"}},
  ...
]}
```

The Firebase Hosting REST API schema for `CloudRunRewrite` accepts only `serviceId`, `region`, and `tag` — there is no `projectId` field. **Cross-project Cloud Run rewrites are not supported by Firebase Hosting.**

Also confirmed: the service agent `service-77998926066@gcp-sa-firebasehosting.iam.gserviceaccount.com` was never created. `gcloud beta services identity create --service=firebasehosting.googleapis.com` rejected with `IAM_SERVICE_NOT_CONFIGURED_FOR_IDENTITIES` (Firebase Hosting opts out of the standard service-identity provisioning API). So we couldn't have granted IAM even if cross-project routing had been supported.

Decision: revert to direct Cloud Run URL + CORS. Site goes live, demo works, proxy can be revisited later with a single-project migration.

---

## 5. Current production state (verified live 2026-05-09)

- Live URLs (both serve the same SPA build):
  - `https://jokesfor.net/` → 200, `index.html` (849 bytes)
  - `https://jokesforfront.web.app/` → 200, `index.html` (849 bytes)
- Deep route SPA rewrite working (`/search`, `/daily-joke`, etc. all return `index.html`).
- Hashed JS asset (`/assets/index-Ra_--fBR.js`) serves with `Cache-Control: public, max-age=31536000, immutable`.
- Bundle inspection confirms baked-in Firebase config + backend URL:
  - `jokesforbackend-332865216810.us-east1.run.app`
  - `/api/v1`
- Firebase config (apiKey, authDomain, etc.) all present in bundle.

### CORS state on the Django backend (Cloud Run service `jokesforbackend`)

Confirmed via OPTIONS preflight:

| Origin | `Access-Control-Allow-Origin` returned? | Demo OK from this origin? |
|--------|---------------------------------------|------------------------|
| `https://jokesforfront.web.app` | ✅ yes, with credentials | **YES** |
| `https://jokesfor.net` | ❌ no (only `vary: origin`) | **NO** until backend allowlist updated |

If a request comes from `https://jokesfor.net`, the backend returns 200 OK with no `Access-Control-Allow-Origin` header, so the browser blocks the actual request. This is normal `django-cors-headers` behavior when the origin isn't in `CORS_ALLOWED_ORIGINS`.

---

## 6. Pre-demo checklist (tomorrow morning, 5 minutes)

### Step 1 — Demo from the right URL

**Use `https://jokesforfront.web.app` for the demo, not `jokesfor.net`.** The CORS allowlist has the `.web.app` URL but not `jokesfor.net`. If you must use `jokesfor.net`, add the backend env var change in Step 2 first.

### Step 2 — (Optional, if demoing from jokesfor.net) Update Django CORS

On the `jokesforbackend` Cloud Run service in the `jokesfor` project:

```bash
gcloud run services update jokesforbackend \
  --project=jokesfor \
  --region=us-east1 \
  --update-env-vars="CORS_ALLOWED_ORIGINS=https://jokesfor.net\,https://jokesforfront.web.app\,https://jokesforfront.firebaseapp.com,CSRF_TRUSTED_ORIGINS=https://jokesfor.net\,https://jokesforfront.web.app\,https://jokesforfront.firebaseapp.com"
```

(The `\,` escapes commas inside a single env var value — gcloud's --update-env-vars uses comma as the separator.)

### Step 3 — Cookie sanity check (browser DevTools)

Open `https://jokesforfront.web.app` in Incognito → DevTools → Application → Cookies → `jokesforbackend-...run.app`:

- Cookie `SameSite` column must read `None`
- Cookie `Secure` column must read `✓`
- If any cookie shows `SameSite=Lax` or no `Secure` flag, login will silently fail on cross-origin requests.

If the cookies are wrong, set these on the Cloud Run service:

```bash
gcloud run services update jokesforbackend \
  --project=jokesfor \
  --region=us-east1 \
  --update-env-vars="SESSION_COOKIE_SAMESITE=None,SESSION_COOKIE_SECURE=True,CSRF_COOKIE_SAMESITE=None,CSRF_COOKIE_SECURE=True,CORS_ALLOW_CREDENTIALS=True"
```

(Add `JWT_COOKIE_SAMESITE=None,JWT_COOKIE_SECURE=True` too if your Django project uses a custom JWT-in-cookie pattern — your axios refresh-token flow strongly suggests this is the case.)

### Step 4 — End-to-end smoke test

1. Open `https://jokesforfront.web.app/` (Incognito)
2. Click "Sign in with Google" → complete OAuth
3. Verify you land in a logged-in state
4. Refresh — should still be logged in (cookies persisted)
5. Open DevTools → Network tab → spot-check that `/api/v1/...` requests return 200 (not 0/CORS-error)
6. Sign out — cookies cleared

If any step fails, the bug is almost certainly in Django cookie/CORS env vars on the Cloud Run revision. The frontend bundle is final and correct.

---

## 7. Google OAuth Console state

Path: https://console.cloud.google.com/apis/credentials?project=jokesfor (or wherever your OAuth client lives)

OAuth 2.0 Client must include both frontend origins:

- Authorized JavaScript origins:
  - `https://jokesforfront.web.app`
  - `https://jokesfor.net` (add this if you'll demo from it)
- Authorized redirect URIs:
  - `https://jokesforfront.web.app/auth/google/callback`
  - `https://jokesfor.net/auth/google/callback` (add this if you'll demo from it)

If `redirect_uri_mismatch` shows up during Google sign-in, the OAuth Console is missing the URI for the origin you're demoing from.

---

## 8. Frontend env-var contract (CI build)

Each push to `main` triggers `.github/workflows/firebase-hosting-merge.yml`. The build step injects these env vars before `vite build`:

| Env var | Source | Default if not set |
|---------|--------|-------------------|
| `VITE_API_URL` | repo variable `VITE_API_URL` | `https://jokesforbackend-332865216810.us-east1.run.app/api/v1` |
| `VITE_USE_MOCKS` | repo variable `VITE_USE_MOCKS` | `false` |
| `VITE_FIREBASE_*` (7 keys) | repo secrets | none (build would inline `undefined`) |

To override `VITE_API_URL` without editing the workflow file (e.g. switch to a staging backend), set it as a [GitHub Actions repository variable](https://github.com/Nard248/JokesFor-Front/settings/variables/actions). The fallback in the workflow only kicks in when no variable is set.

Local development uses `.env`, which is gitignored. `.env.example` documents every key.

---

## 9. Future: making the proxy work (post-demo migration)

If you want the same-origin elegance of `jokesfor.net/api/**` routing through Firebase Hosting to Django, the only path that actually works is **single-project**: move Cloud Run to `jokesforfront` (or move Firebase Hosting to `jokesfor`). Firebase Hosting cannot proxy across GCP projects.

**Recommended direction**: move Cloud Run to `jokesforfront` (where Firebase Hosting and the custom domain already live). Steps:

1. **Identify the running container image:**
   ```bash
   gcloud run services describe jokesforbackend \
     --project=jokesfor --region=us-east1 \
     --format='value(spec.template.spec.containers[0].image)'
   ```
   Note the digest (`gcr.io/...@sha256:...`). This stays the same in the new project.

2. **Mirror env vars and secrets:**
   ```bash
   gcloud run services describe jokesforbackend \
     --project=jokesfor --region=us-east1 \
     --format='yaml(spec.template.spec.containers[0].env)'
   ```
   Save this. You'll need to recreate every env var (and Secret Manager binding) on the new project's Cloud Run service.

3. **Cloud SQL access (if applicable):** the new project's compute service account (`<NEW_PROJECT_NUMBER>-compute@developer.gserviceaccount.com`) needs Cloud SQL Client + Cloud SQL Instance User on the existing Cloud SQL instance in `jokesfor`. Easier: also migrate Cloud SQL to `jokesforfront` if practical.

4. **Deploy the same image to `jokesforfront`:**
   ```bash
   gcloud run deploy jokesforbackend \
     --image=<image-from-step-1> \
     --project=jokesforfront \
     --region=us-east1 \
     --allow-unauthenticated \
     --set-env-vars=...  # mirror everything from step 2
   ```

5. **Restore the Firebase rewrite** in `firebase.json`:
   ```json
   "rewrites": [
     { "source": "/api/**", "run": { "serviceId": "jokesforbackend", "region": "us-east1" } },
     { "source": "**", "destination": "/index.html" }
   ]
   ```
   No `projectId` needed now — same project.

6. **Workflow defaults** (both `.yml` files): set `VITE_API_URL` back to `/api/v1` (relative), keep `VITE_USE_MOCKS=false`.

7. **Tighten Django settings** for same-origin:
   - Drop `CORS_ALLOWED_ORIGINS` (no cross-origin requests anymore)
   - `SESSION_COOKIE_SAMESITE=Lax` (safer default)
   - Keep `CSRF_TRUSTED_ORIGINS` for the host domain

8. **Update Google OAuth Console** — origins/redirect URIs only need `https://jokesfor.net` going forward.

9. **Decommission** the old Cloud Run service in `jokesfor` after a soak period. Keep the project around until you're sure nothing else (logs, monitoring, alerts) is referencing it.

Estimated effort: half a day, mostly on the backend side. Done well, the frontend changes are about 4 lines.

---

## 10. References

- Firebase Hosting REST API — `CloudRunRewrite` schema: https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.versions#cloudrunrewrite
- Firebase Hosting + Cloud Run guide: https://firebase.google.com/docs/hosting/cloud-run
- GitHub Actions repo: https://github.com/Nard248/JokesFor-Front
- Cloud Run service (current): https://console.cloud.google.com/run/detail/us-east1/jokesforbackend?project=jokesfor
- Firebase Hosting console: https://console.firebase.google.com/project/jokesforfront/hosting
