# End-to-end suite

A real browser, driving the real SPA, against the real Django API and a real
Postgres. Nothing is mocked.

## Why this tier exists

The project has 1,676 unit tests — 799 vitest, 877 Django — and they were all
green while three P0 bugs sat in production:

- a locked joke shipped its punchline in the `text` field on **every** API path,
  for 121 of 314 live jokes;
- the public share page rendered the same field to anyone, with no auth;
- `DELETE /users/me/` destroyed the user's uploaded files and then 500'd,
  leaving the account intact.

None of that was a gap in *diligence*. It is structural: the frontend suite runs
in jsdom against `src/lib/mock-api.ts`, and the backend suite patches Stripe,
Vision, GCS and email. **Each side is tested against its own idea of the
contract, so drift between them is invisible to both.** The paywall fixtures even
build jokes with `text=''`, unlike real published rows — so the tests could not
have seen the leak even in principle.

This suite exercises the wire between the two. It is the only tier that can.

## Running it

```bash
npm run e2e              # everything
npm run e2e:desktop      # desktop project only
npm run e2e:mobile       # the *.mobile.spec.ts specs, under Pixel 5
npm run e2e:headed       # watch it happen
npm run e2e:ui           # Playwright's interactive runner
npm run e2e:report       # open the last HTML report
```

Playwright starts **both** servers itself, on ports that deliberately avoid the
dev defaults (backend `:8011`, frontend `:5274`) so a run never collides with a
dev server you already have open. Before serving, it runs `migrate`,
`seed_achievements` and `seed_e2e`, so a run can never execute against a stale
schema or an empty catalogue.

### Prerequisites

- Postgres running locally with a `jokesfor` database (defaults: `postgres` /
  `6969`; override with `E2E_DB_USER` / `E2E_DB_PASSWORD` / `E2E_DB_NAME`).
- The backend checkout with its `.venv` populated. Defaults to
  `/Users/narekmeloyan/PycharmProjects/JokesForProject`; override with
  `E2E_BACKEND_DIR`.
- On macOS, Homebrew `cairo` for share-card rendering (the config already
  exports `DYLD_FALLBACK_LIBRARY_PATH`).

`DATABASE_URL` is forced to `''` for the backend process, which pins it to the
local `DB_*` settings. **A suite run can never point at production Neon.**

## How these specs are written

Three conventions, each of which exists because of a specific bug that got
through:

**1. Assert on the payload, not only the pixels.** The paywall leak rendered a
correct `████` redaction on screen while shipping the punchline in the JSON. Any
spec that only read the page would have passed. Use `apiGet(page, path)` — it
runs in the browser's own session, so what you inspect is exactly what the app
received.

**2. Cover every variant, not a convenient one.** The leak was format-specific:
one-liners were safe, two-part jokes were not. A hand-check that happened to
sample a one-liner found nothing. `seed_e2e` therefore creates one joke of every
format, and the regression spec loops over all of them.

**3. Set up through the API; assert through the thing under test.** Driving
twelve clicks to reach a capped-paywall state is slow and brittle. Driving it
through `exhaustFreeReads()` and then asserting the UI is fast and precise.

Each spec creates its own account. That costs a second or two and buys real
isolation — the paywall, streaks and achievements are all per-user-per-day, so a
shared fixture user would make specs order-dependent and quietly flaky. A flaky
E2E suite gets muted, which would put us back where we started.

## Email

The backend runs with Django's file-based email backend, writing to a temp
directory. `fixtures/mail.ts` reads the verification code out of the real
rendered message.

This is deliberate. The alternative was a test-only "activate this user"
endpoint — a code path whose only purpose is skipping authentication, living in
the production codebase forever. Reading the sent mail keeps the whole flow
honest: the template, the notification service and the code-issuing path all run
exactly as they do in production. Only the transport changes.

## Layout

```
e2e/
  fixtures/
    api.ts     typed client + paywall helpers (exhaustFreeReads, unreadJokeId, …)
    auth.ts    personas, UI signup, API signup, declineCookies
    mail.ts    read the real verification email off disk
  *.spec.ts            desktop project
  *.mobile.spec.ts     Pixel 5 project
```

## Adding a spec

Start from `paywall.spec.ts`; it is the reference. Before writing an assertion,
ask the question this suite is for: **would this still pass if the bug were
back?** If the answer is yes because the check only looks at rendered text, go
one level down and look at the payload.
