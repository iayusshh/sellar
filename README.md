# Sellar

Sellar is a creator-first monetization platform for selling digital products.

It includes:
- Public creator storefronts
- Buyer checkout and library access
- Creator product and wallet dashboards
- Admin and owner operations portal
- Cashfree payment flow via Supabase Edge Functions

## Runtime Status (Important)

This repository contains two tracks of code.

- Active app/runtime: Vite + React in `src/` with Supabase backend
- Legacy/reference track: Next.js + Prisma files in `app/`, `lib/`, `prisma/`, `auth.ts`

Use `npm run dev` for the active app.

## Feature Coverage (Implemented)

### Public
- Landing page with feature sections and top creators
- Public creator storefront route at `/:handle`
- Product cards with pricing and purchase CTA

### Auth and Accounts
- General account sign-up/sign-in
- Creator onboarding and upgrade flow (`/become-a-creator`)
- Google OAuth sign-in
- Forgot/reset password screens
- Email verification screen
- Owner-only sign-in route

### Buyer
- Purchase flow from storefront via Cashfree Drop-in
- Payment return reconciliation page (`/payment/return`)
- My Library page with purchased products and content links
- Buyer-only route guard to prevent creator access to buyer pages

### Creator
- Creator dashboard (KPIs, earnings chart, recent transactions)
- Product CRUD (create/edit/hide/delete-soft)
- Product image upload to Supabase Storage (`products` bucket)
- Wallet page with withdrawal request creation
- Creator profile settings with avatar and social links

### Admin and Owner
- Admin portal tabs: overview, creators, products, users/purchases, withdrawals, commission, traffic, demographics
- Commission management per creator
- Featured creator management and ordering
- Creator removal tooling
- Withdrawal status updates
- Owner route uses the same portal UI as admin

## Tech Stack

- Frontend: React 18, Vite 5, TypeScript, Tailwind CSS, Radix UI
- State/Data: TanStack Query, React Router
- Backend: Supabase Auth, Postgres, Storage, Edge Functions
- Payments: Cashfree (Drop-in SDK + webhook/reconciliation functions)
- Charts/UX: Recharts, Framer Motion, Sonner

## Project Structure

- `src/` active Vite application
- `supabase/functions/` Cashfree Edge Functions
- `supabase/sql/init/` base schema and seed SQL
- `supabase/sql/migrations/` incremental SQL required for full feature parity
- `scripts/` setup and verification helpers
- `docs/` product and setup notes

## Quick Start

### 1. Prerequisites

- Node.js 18+
- npm
- Supabase project

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Set these values in `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_CASHFREE_MODE=sandbox
VITE_SITE_URL=http://localhost:8080
```

Note: Vite runs on port `8080` in this project.

### 4. Run SQL in Supabase SQL Editor

For a fresh Supabase project, run these files in this order:

1. `supabase/sql/init/supabase-schema.sql`
2. `supabase/sql/migrations/supabase-cashfree-migration.sql`
3. `supabase/sql/migrations/fix-settle-purchase-and-creator-flag.sql`
4. `supabase/sql/migrations/add-featured-creators.sql`
5. `supabase/sql/migrations/fix-admin-rls-policies.sql`
6. `supabase/sql/migrations/fix-profile-permissions-v2.sql`
7. `supabase/sql/migrations/fix-table-grants.sql`
8. `supabase/sql/migrations/fix-service-role-purchases-grants.sql`
9. `supabase/sql/migrations/add-webinar-products.sql`

Optional demo data:

10. `supabase/sql/init/seed-data.sql`
11. `supabase/sql/migrations/update-images.sql`

If you previously used older schema files, review `supabase/sql/migrations/supabase-migration.sql` and `supabase/sql/migrations/content-delivery-migration.sql` before applying manually.

### 5. Configure Cashfree secrets for Edge Functions

Set these via Supabase secrets (do not place them in committed files):

- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_WEBHOOK_SECRET`
- `CASHFREE_ENV` (`sandbox` or `production`)
- `SITE_URL` (for local dev: `http://localhost:8080`)
- `SUPABASE_SERVICE_ROLE_KEY`

Deploy functions:

```bash
supabase functions deploy create-cashfree-order
supabase functions deploy verify-cashfree-order
supabase functions deploy cashfree-webhook --no-verify-jwt
supabase functions deploy generate-webinar-join-token
```

### 6. Start the app

```bash
npm run dev
```

Open `http://localhost:8080`.

## Useful Scripts

```bash
npm run dev              # Start Vite dev server (port 8080)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint
npm run type-check       # TypeScript checks
npm run test             # Vitest run (infrastructure present)
npm run test:watch       # Vitest watch mode
npm run supabase:setup   # Guided env/setup helper
npm run supabase:verify  # Verifies core Supabase tables/connectivity
```

## Key Routes

- `/` landing page
- `/top-creators` featured creators listing
- `/become-a-creator` creator onboarding/upgrade
- `/auth/signin`, `/auth/signup`, `/auth/owner`
- `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`
- `/library` buyer library
- `/creator/dashboard`, `/creator/products`, `/creator/wallet`, `/creator/settings`
- `/admin/portal`, `/owner/portal`
- `/payment/return` payment reconciliation
- `/:handle` public storefront

## Known Gaps and Current Limitations

- Automated test files are not present yet (Vitest setup exists, but coverage is minimal)
- Payout processing is workflow-level (transaction status updates) rather than bank-rail automation
- No first-class refund/dispute flow yet
- Traffic and demographics views depend on data in `visits`/`clients`; auto-capture is limited
- Next.js/Prisma codepath is present but not the active runtime

## Suggested Next Features (to make Sellar more functional)

### Priority 1: Revenue and trust
- Add full refund and dispute management (buyer request, creator response, admin resolution)
- Add invoice generation (GST-compliant PDF, tax breakdown, invoice email)
- Add payout lifecycle states with audit trail and admin notes
- Add notification pipeline (email + in-app) for purchase, payout, and account events

### Priority 2: Conversion and creator growth
- Add coupons, limited-time offers, and bundle pricing
- Add upsell/downsell on checkout and post-purchase pages
- Add product categories, filtering, and better storefront SEO metadata
- Add abandoned checkout recovery messaging

### Priority 3: Delivery and access control
- Add secure asset delivery links (expiring/signed URLs)
- Add content versioning and buyer re-download controls
- Add Telegram automation for paid group access (join/revoke based on entitlement)
- Add subscription products in addition to one-time purchases

### Priority 4: Data and operations
- Add event instrumentation and funnel analytics (view -> checkout -> paid)
- Add anomaly/fraud flags for suspicious purchases and payout requests
- Add admin audit logs for sensitive actions (commission changes, creator removal)
- Add creator-level cohort and retention analytics

## Troubleshooting

- If Supabase errors appear immediately, verify `.env` values and restart `npm run dev`
- If checkout returns pending/unknown too often, verify deployed functions and all Cashfree secrets
- If admin portal data is blank, confirm grants/migrations in the SQL order above
- If profile/product uploads fail, ensure `avatars` and `products` Storage policies were created
