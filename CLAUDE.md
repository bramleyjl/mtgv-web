# mtgv-web — Claude Context

## What this is
Next.js 15 frontend for MTGVersioner. Users paste a deck list, the app fetches card versions from mtgv-api, and users select which printing they want for each card. Exports a card package for use with TCGPlayer, Moxfield, mtgprint, etc.

## Stack
- **Framework**: Next.js 15, App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Forms**: react-hook-form + zod
- **Icons**: lucide-react
- **Testing**: Jest + React Testing Library

## Directory structure
```
src/
  app/                  # Next.js App Router pages and API routes
    api/                # Route handlers (proxy calls to mtgv-api)
      card_packages/    # create, get, export, random
      cards/search/     # card autocomplete search
      cache/            # cache management
    page.tsx            # Main page
    layout.tsx
  components/           # UI components
  hooks/                # Custom React hooks
  lib/                  # Utilities and API client
  types/index.ts        # Shared TypeScript types
```

## Key components
- `CardPackageManager` — top-level orchestrator component
- `CardList` / `CardListTabs` — displays card rows with version selectors
- `CardDisplay` — individual card with image lazy loading
- `CardVersion` — version selector per card
- `CardInput` / `EditableCardName` — card name input with autocomplete
- `FreeTextInput` — bulk deck list paste input
- `ImportUrlInput` — import from deckbuilder URL
- `ExportButtons` — export package to various formats
- `ControlPanel` — sorting, filtering, display controls
- `GameSelector` — format selector (Standard, Modern, Commander, etc.)
- `ErrorDisplay` — user-facing error UI

## Key hooks
- `useCardPackage` — central state hook: manages card package lifecycle, WebSocket connection, card selection state. This is the most complex hook; stale closure bugs have bitten here before — be careful with useEffect dependencies.
- `useCardAutocomplete` — card name search/autocomplete
- `useExport` — export formatting and clipboard

## Key lib files
- `api.ts` — typed API client (calls Next.js API routes, which proxy to mtgv-api)
- `deckListParser.ts` — parses pasted deck lists into card name arrays
- `websocket.ts` — WebSocket client connecting to mtgv-api
- `cache.ts` — client-side caching layer
- `clipboard.ts` — clipboard read/write utilities
- `validation.ts` — input validation helpers

## Architecture decisions
- **mtgv-web proxies to mtgv-api** — no direct client-side calls to the backend API; all requests go through Next.js API route handlers in `src/app/api/`
- **WebSocket**: real-time updates from mtgv-api (port 4000) via `websocket.ts`; managed in `useCardPackage`
- **Lazy loading**: card images use lazy loading to handle large deck lists without performance issues
- **No server components for card display** — card selection state is fully client-side; don't convert interactive components to Server Components

## npm scripts
- `npm run dev` — Next.js dev server (Turbopack)
- `npm test` — Jest
- `npm run test:coverage` — coverage report
- `npm run lint` / `npm run format` — ESLint + Prettier

## Environment variables
- `NEXT_PUBLIC_API_URL` — base URL for mtgv-api (used in API route handlers)
- `NEXT_PUBLIC_WS_URL` — WebSocket URL for mtgv-api
See `Secrets management & key security` Notion card for full list.

## Hosting (Render)
- Staging service live on Render starter tier
- Cold start ~11s — always-on instances needed for production
- Auto-deploys from GitHub on push to main

## Notion tracking
MTGVersioner kanban: https://app.notion.com/p/bramleyjl/d7f0ee3c2cec4f079e48698232dfe02e?v=e577c2a446b848b9964d1880d158daef
Collection ID (for MCP queries): `b3d9cce2-f7ec-4f8c-9596-7271988b3b14`

## Known deferred work (Icebox)
- Mobile nav bar collapse (hamburger menu)
- Color themes (MTG 5-color palette drafted)
- State management refactor (gated on React/Next.js deep dive)
- Fblthp "Totally Lost" as card-not-found fallback image
- DFC card parsing in deck list parser (front-face name only from Moxfield etc.)
