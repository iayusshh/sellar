# Sellar

Creator-first monetization platform (Cosmofeed/Graphy style), focused on creator storefronts, wallet payouts, and digital product sales.

## Current Workflow

- Active frontend runtime: Vite + React app in `src/`
- Supabase edge functions: `supabase/functions/`
- Reference/parallel server-side code: `app/`, `lib/`, `prisma/`

The developer workflow remains the same: run the app with `npm run dev`.

## Quickstart (Local)

1. Install dependencies

```bash
npm install
```

2. Create local env file

```bash
cp .env.example .env
```

3. Add your Supabase credentials in `.env`

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_CASHFREE_MODE=sandbox
VITE_SITE_URL=http://localhost:8080
```

4. Initialize Supabase schema

- Run `supabase/sql/init/supabase-init.sql` in Supabase SQL Editor.
- Optional sample records: run `supabase/sql/init/seed-data.sql`.

5. Start development server

```bash
npm run dev
```

Open http://localhost:8080

## Useful Scripts

```bash
npm run dev              # Start local app
npm run build            # Production build
npm run preview          # Preview built app
npm run lint             # Lint codebase
npm run type-check       # TypeScript checks
npm run test             # Run Vitest suite
npm run supabase:setup   # Guided Supabase setup helper
npm run supabase:verify  # Verify Supabase tables and connectivity
```

## Restructured Folders

To keep the root clean without changing runtime behavior, docs/scripts/sql files are now grouped:

- `docs/`:
	- `docs/masterplan.md`
	- `docs/PROJECT_SUMMARY.md`
	- `docs/SUPABASE_SETUP.md`
- `scripts/`:
	- `scripts/setup-supabase.sh`
	- `scripts/verify-supabase.js`
- `supabase/sql/init/`:
	- `supabase/sql/init/supabase-init.sql`
	- `supabase/sql/init/supabase-schema.sql`
	- `supabase/sql/init/seed-data.sql`
- `supabase/sql/migrations/`:
	- all incremental SQL migration/patch scripts

## Project Map

- `src/`: active Vite application (routes, UI, contexts, hooks)
- `supabase/functions/`: edge functions for Cashfree order lifecycle
- `supabase/sql/`: SQL setup and migrations
- `app/`: Next.js route tree kept for ongoing migration/reference
- `docs/`: setup and product documentation

## Notes

- If Supabase checks fail in UI, verify you ran `supabase/sql/init/supabase-init.sql`.
- Keep real secrets in Supabase secrets or local `.env` files only.
