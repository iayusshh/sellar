# Sellar

Creator-first monetization platform (Cosmofeed/Graphy-style) — **not a marketplace**.

## Quickstart (local)

1. Configure env

```bash
cp .env.example .env
```

Create a Postgres database (Neon/Supabase/Railway/etc.) and paste its connection string into `DATABASE_URL`.

2. Run DB migrations + seed

```bash
npx prisma db push
npm run seed
```

3. Start the app

```bash
npm run dev
```

Then open http://localhost:3000

## Optional: Postgres

If you want a local Postgres instance, use the included docker-compose and point `DATABASE_URL` to it.

## Deploy (Vercel)

1. Push to GitHub.
2. Create a hosted Postgres database and set `DATABASE_URL` in Vercel.
3. Set env vars in Vercel:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (set to your Vercel domain)
- `PLATFORM_COMMISSION_RATE` (optional)
- Stripe vars if you want real checkout: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

This repo includes a `vercel-build` script that runs `prisma migrate deploy` during build.

## Repo layout

- app/: Next.js app routes
- lib/: server utilities (Prisma, Stripe, wallet, email)
- prisma/: schema + migrations + seed
- masterplan.md: product blueprint
