# JokesFor Constellations

An audience-side community experiment implemented in the main JokesFor frontend repository. It has its own HTML entry, React feature directory, Vite configuration and build output. The existing application routes and creator portal are preserved.

## Run

With the isolated community Django server on `127.0.0.1:8017`:

```sh
npm run dev:communities
```

Open `http://127.0.0.1:5187/communities.html`. Vite proxies `/api` to the dedicated backend. The local `.community-cache` keeps dependency caches separate from the shared `node_modules` directory.

## Verify

```sh
npm run test:communities
node_modules/.bin/tsc --project tsconfig.communities.json --incremental false
node_modules/.bin/eslint src/features/communities vite.communities.config.ts
npm run build:communities
npm run e2e:communities
```

The separate Playwright configuration and `e2e/community-lab.e2e.ts` exercise the real backend without being discovered by the ordinary application browser suite. Start the backend with `bash scripts/community-lab.sh serve` from `/Users/narekmeloyan/PycharmProjects/JokesForProject`. See its `Docs/Community_Lab_Runbook.md` for seeding, database isolation and server startup.

The community build uses its own TypeScript entry scope so unrelated work in progress in creator pages does not block the standalone demo. The normal application build still checks the entire application.

## Visual standards

The entry imports the shared `src/index.css` design system and the same fonts as `index.html`: Plus Jakarta Sans, Epilogue, Fraunces and JetBrains Mono. Branding uses the existing purple app icon. The Flow background, purple pill controls, lime joke surfaces, card radii and responsive spacing match the application. Feature styles are scoped to the community roots and dialog, preserving other pages. The standalone header links to sections of the demo; it does not impersonate an authenticated application session.

## Behavior

- Every aggregate, subject, joke and activity event is read from the backend. Mutation results replace the snapshot; failures never show fake success.
- The frontend uses the isolated `community_lab_csrf` cookie. Concurrent mutations are blocked. A failed share retains its event ID so retries are idempotent.
- The graph is a labeled sample of synthetic people. Overall view places each person at their primary subject using deterministic offsets. A focused subject groups its connected people together, including people whose strongest interest is elsewhere.
- Search and joined filters affect the graph. Subject buttons, SVG keyboard controls and list alternatives expose selection accessibly; zoom has a reset control. The method dialog uses native modal focus handling.
- Explicit join/leave, synthetic sharing, optional automatic simulation and seven-day advancement all call the working API. Automatic simulation stops on mutation failure or time advancement.
- Demo identity, sample scope and synthetic attribution remain visible. This is not connected to real user or creator activity.

Eight component tests cover initial loading, CSRF-protected membership, failed writes, pending action locking, stable share retry IDs, search and keyboard selection, server-authoritative time advancement and connection retry.
