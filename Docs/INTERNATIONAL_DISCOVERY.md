# International joke discovery

Status: implemented locally, 2026-09-27. The application interface remains English; these controls select joke content.

The canonical `FlowAppShell` exposes “Joke languages” on desktop, tablet and mobile. Regional collection buttons apply a complete language/country/culture combination; the three separate selectors allow independent choices and an All option for each. Native language names are used without flag icons. `/explore` is public. The picker is shown only on the reading surfaces the selection scopes — Today, Explore (including Trending), Search and Daily — plus pack detail pages, which opt in with `showContentSelection`. Everywhere else it is hidden: Creator Studio and the creation flow (format picker, editor, submission view), Communities, Favorites, Library/Collections, Drafts, Submit, Profile, Settings, Billing and creator profiles. Those surfaces are not scoped by the selection, so showing it there would imply a filter that does not apply (and in the editor it would sit next to the draft's own "Joke language" field).

## State and URLs

`src/features/discovery/selection.ts` defines `language`, `country`, and `culture_tags`. An explicit selector in the URL describes the complete selection; dimensions omitted from that URL become All. A URL without any selectors uses the browser's remembered preference. Empty selector values are preserved in URLs so an explicit All choice overrides another browser's preferences.

Examples:

- `/explore?language=hy&country=AM&culture_tags=armenia-everyday`
- `/search?q=caf%C3%A9&language=fr&country=&culture_tags=`

The Zustand store persists under `jokesfor-content-selection`. This is a browser preference, independent of account settings. `ContentSelectionBoundary` resolves URLs before descendant queries run, then synchronizes the remembered selection. `useContentSelection()` is for API hooks; `useBrowseSelection()` also supports standalone router previews.

## API contract

`GET /api/v1/discovery-locales/` supplies language and country native names, cultural descriptions, and real collection counts. No generated placeholder counts are displayed. The selectors are independent; matching across dimensions is an intersection. Empty values mean All. An explicit selection never falls back to English.

Selection is included in query keys and requests for joke search, random jokes, daily today/history, tomorrow previews, trending, mystery rolls and packs. Direct joke links remain accessible. Explore scopes accumulated pages by every active filter and starts at page one after a filter change; previous-language results are never used as placeholders. Search owns its infinite pagination in `features/jokes/api.ts`.

The editor exposes its existing language field and a `countries: string[]` country picker. Country codes are preserved through the editor reducer, autosave, API DTOs, and mock transport. Published cards carry content `lang`, and joke details can display the backend's cultural note.

## Verification

Unit coverage includes independent selectors, native names, saved state, shared URL precedence, explicit All, unsupported selections, catalogue errors, switching locale after accumulating multiple pages, country DTO round-trips and editing, and daily-save state after changing jokes.

The real browser contract test is `e2e/discovery.spec.ts`. Run it against an isolated local database:

```sh
E2E_DB_NAME=jokesfor_international E2E_BACKEND_PORT=8022 E2E_FRONTEND_PORT=5285 E2E_API_ORIGIN=http://localhost:8022 npm run e2e -- e2e/discovery.spec.ts --project=desktop --output=/tmp/jokesfor-international-e2e
```

The suite checks the five required native languages, strict filter intersections, remembering and sharing selections, absence of English carryover, and geometry at 375, 768 and 1280 pixels. The separate output directory avoids collisions with other concurrent Playwright runs.
